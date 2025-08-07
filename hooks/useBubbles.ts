import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from "@burnt-labs/abstraxion-react-native";
import { BubbleMetadata, UserVerification, CreateBubbleFormData } from '@/types/bubble';

if (!process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS) {
  throw new Error("EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS is not set in your environment file");
}

const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS as string;

export function useBubbles() {
  const abstraxionAccount = useAbstraxionAccount();
  const abstraxionSigningClient = useAbstraxionSigningClient();
  const abstraxionClient = useAbstraxionClient();

  const { data: account, isConnected } = abstraxionAccount || {};
  const { client } = abstraxionSigningClient || {};
  const { client: queryClient } = abstraxionClient || {};

  const [bubbles, setBubbles] = useState<BubbleMetadata[]>([]);
  const [userVerifications, setUserVerifications] = useState<{ [bubbleId: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch bubbles from DocuStore
  const fetchBubbles = async () => {
    if (!queryClient) {
      console.log("Cannot fetch bubbles - missing queryClient");
      return;
    }

    try {
      console.log("Fetching bubbles from DocuStore...");
      
      // Approach 1: Try to get all bubbles from the unified bubble_metadata collection
      let bubbleData: BubbleMetadata[] = [];
      
      const owners = ["registry"];
      if (account?.bech32Address) {
        owners.unshift(account.bech32Address);
      }
      
      for (const owner of owners) {
        try {
          console.log(`Trying to fetch bubbles from owner: ${owner}`);
          const response = await queryClient.queryContractSmart(contractAddress, {
            UserDocuments: {
              owner,
              collection: "bubble_metadata"
            }
          });
          
          if (response?.documents && response.documents.length > 0) {
            console.log(`Found ${response.documents.length} bubbles from owner ${owner}:`, response.documents);
            
            response.documents.forEach(([id, doc]: [string, any]) => {
              try {
                const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
                console.log(`Processing bubble ${id}:`, data);
                // Avoid duplicates
                if (!bubbleData.find(b => b.id === data.id)) {
                  bubbleData.push(data);
                }
              } catch (error) {
                console.log(`Error parsing bubble data for ${id}:`, error);
              }
            });
          } else {
            console.log(`No bubbles found from owner ${owner}`);
          }
        } catch (error) {
          console.log(`Error fetching bubbles from owner ${owner}:`, error);
        }
      }
      
      // Approach 2: If no bubbles found yet, try to get bubble IDs from registry and fetch individually
      if (bubbleData.length === 0) {
        console.log("No bubbles found in unified collection, trying registry approach...");
        
        let bubbleIds: string[] = []; // No default bubbles
        
        // Try to get bubble IDs from registry
        for (const owner of owners) {
          try {
            const registryResponse = await queryClient.queryContractSmart(contractAddress, {
              UserDocuments: {
                owner,
                collection: "bubble_registry"
              }
            });
            
            if (registryResponse?.documents && registryResponse.documents.length > 0) {
              const [, doc] = registryResponse.documents[0];
              const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
              if (data.bubbleIds && Array.isArray(data.bubbleIds)) {
                bubbleIds = [...new Set([...bubbleIds, ...data.bubbleIds])];
                console.log(`Found bubble IDs from registry (${owner}):`, bubbleIds);
                break;
              }
            }
          } catch (error) {
            console.log(`Error fetching bubble registry from ${owner}:`, error);
          }
        }

        console.log("Fetching data for bubble IDs:", bubbleIds);
        
        // Now fetch actual bubble metadata for each ID
        for (const bubbleId of bubbleIds) {
          try {
            let found = false;
            
            const collectionPatterns = [`bubble_metadata_${bubbleId}`, "bubble_metadata"];
            
            for (const collection of collectionPatterns) {
              if (found) break;
              
              for (const owner of [...owners, "system"]) {
                try {
                  const response = await queryClient.queryContractSmart(contractAddress, {
                    UserDocuments: {
                      owner,
                      collection
                    }
                  });
                  
                  if (response?.documents && response.documents.length > 0) {
                    // For bubble_metadata collection, find the right document
                    let targetDoc = null;
                    if (collection === "bubble_metadata") {
                      targetDoc = response.documents.find(([id]: [string, any]) => id === bubbleId);
                    } else {
                      targetDoc = response.documents[0];
                    }
                    
                    if (targetDoc) {
                      const [, doc] = targetDoc;
                      const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
                      console.log(`Found bubble data for ${bubbleId} (${collection}, ${owner}):`, data);
                      if (!bubbleData.find(b => b.id === data.id)) {
                        bubbleData.push(data);
                      }
                      found = true;
                      break;
                    }
                  }
                } catch (error) {
                  continue;
                }
              }
            }
          } catch (error) {
            console.log(`Error fetching bubble ${bubbleId}:`, error);
          }
        }
      }

      console.log("Final bubble data:", bubbleData);
      setBubbles(bubbleData);
    } catch (error) {
      console.error("Error fetching bubbles:", error);
      // No fallback bubbles - if there's an error, show empty list
      setBubbles([]);
    }
  };

  // Fetch user verifications
  const fetchUserVerifications = async () => {
    if (!queryClient || !account) return;

    try {
      const response = await queryClient.queryContractSmart(contractAddress, {
        UserDocuments: {
          owner: account.bech32Address,
          collection: "bubble_verifications"
        }
      });

      if (response?.documents) {
        const verifications: { [bubbleId: string]: boolean } = {};
        response.documents.forEach(([, doc]: [string, any]) => {
          const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
          verifications[data.bubbleId] = data.verified;
        });
        setUserVerifications(verifications);
      }
    } catch (error) {
      console.log("No user verifications found or error:", error);
    }
  };

  // Create new bubble
  const createBubble = async (formData: CreateBubbleFormData) => {
    if (!client || !account) {
      Alert.alert("Error", "Please connect your wallet first");
      return false;
    }

    if (!formData.name.trim() || !formData.domain.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return false;
    }

    try {
      console.log("Creating new bubble...");

      // Generate bubble ID from domain
      const bubbleId = formData.domain.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if bubble already exists
      try {
        const existingBubble = await queryClient?.queryContractSmart(contractAddress, {
          UserDocuments: {
            owner: account.bech32Address,
            collection: "bubble_metadata"
          }
        });
        
        if (existingBubble?.documents && existingBubble.documents.length > 0) {
          // Check if any document has the same bubbleId
          const existingDoc = existingBubble.documents.find(([id]: [string, any]) => id === bubbleId);
          if (existingDoc) {
            Alert.alert("Error", "A bubble with this domain already exists");
            return false;
          }
        }
      } catch (error) {
        // Bubble doesn't exist, which is what we want
        console.log("No existing bubbles found for this user:", error);
      }

      const newBubble: BubbleMetadata = {
        id: bubbleId,
        name: formData.name,
        description: formData.description,
        verified: false, // New bubbles start unverified
        createdAt: new Date().toISOString(),
        createdBy: account.bech32Address,
        permissions: formData.permissions,
        settings: formData.settings,
        memberCount: 0 // Start with 0 members
      };

      // Store bubble metadata in DocuStore
      await client.execute(
        account.bech32Address,
        contractAddress,
        {
          Set: {
            collection: "bubble_metadata",
            document: bubbleId,
            data: JSON.stringify(newBubble)
          }
        },
        "auto"
      );

      console.log(`Bubble ${bubbleId} created and stored in bubble_metadata collection`);

      // Also add this bubble to the global bubble registry for redundancy
      try {
        // First, try to get existing bubble list
        let existingBubbles: string[] = [];
        try {
          const response = await queryClient?.queryContractSmart(contractAddress, {
            UserDocuments: {
              owner: account.bech32Address,
              collection: "bubble_registry"
            }
          });
          
          if (response?.documents && response.documents.length > 0) {
            const [, doc] = response.documents[0];
            const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
            existingBubbles = data.bubbleIds || [];
          }
        } catch (error) {
          console.log("No existing bubble registry found, creating new one");
        }

        // Add the new bubble if it's not already in the list
        if (!existingBubbles.includes(bubbleId)) {
          existingBubbles.push(bubbleId);
          
          // Update the registry
          await client.execute(
            account.bech32Address,
            contractAddress,
            {
              Set: {
                collection: "bubble_registry",
                document: "all_bubbles",
                data: JSON.stringify({ bubbleIds: existingBubbles })
              }
            },
            "auto"
          );
          
          console.log(`Added ${bubbleId} to bubble registry. Total bubbles: ${existingBubbles.length}`);
        }
      } catch (error) {
        console.log("Error updating bubble registry:", error);
        // This is not critical, the bubble is still created
      }

      Alert.alert("Success", "Bubble created successfully!");
      
      // Refresh bubbles list
      await fetchBubbles();
      return true;
    } catch (error) {
      console.error("Error creating bubble:", error);
      Alert.alert("Error", "Failed to create bubble. Please try again.");
      return false;
    }
  };

  // Verify user for a bubble
  const verifyForBubble = async (bubbleId: string) => {
    if (!client || !account) {
      Alert.alert("Error", "Please connect your wallet first");
      return false;
    }

    try {
      const verification: UserVerification = {
        userId: account.bech32Address,
        bubbleId,
        verified: true,
        verifiedAt: new Date().toISOString()
      };

      await client.execute(
        account.bech32Address,
        contractAddress,
        {
          Set: {
            collection: "bubble_verifications",
            document: `${account.bech32Address}_${bubbleId}`,
            data: JSON.stringify(verification)
          }
        },
        "auto"
      );

      // Update local state
      setUserVerifications(prev => ({
        ...prev,
        [bubbleId]: true
      }));

      const bubbleName = bubbles.find(b => b.id === bubbleId)?.name || 'this bubble';
      Alert.alert("Success", `You are now verified for ${bubbleName}!`);
      return true;
    } catch (error) {
      console.error("Error verifying for bubble:", error);
      Alert.alert("Error", "Failed to verify. Please try again.");
      return false;
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBubbles(), fetchUserVerifications()]);
    setRefreshing(false);
  };

  // Effects
  useEffect(() => {
    fetchBubbles();
  }, [queryClient]);

  useEffect(() => {
    if (account?.bech32Address) {
      fetchUserVerifications();
    }
  }, [account?.bech32Address, queryClient]);

  return {
    bubbles,
    userVerifications,
    loading,
    refreshing,
    isConnected,
    account,
    client,
    queryClient,
    fetchBubbles,
    fetchUserVerifications,
    createBubble,
    verifyForBubble,
    onRefresh
  };
}
