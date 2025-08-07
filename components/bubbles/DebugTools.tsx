import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BubbleMetadata } from '@/types/bubble';

interface DebugToolsProps {
  account: any;
  client: any;
  queryClient: any;
  contractAddress: string;
  onRefresh: () => void;
}

export function DebugTools({ account, client, queryClient, contractAddress, onRefresh }: DebugToolsProps) {
  const createPreloadedBubbles = async () => {
    if (!client || !account) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }
    
    console.log("=== DEBUG: Creating preloaded bubbles ===");
    
    const preloadedBubbles = [
      {
        id: "github",
        name: "@github.com", 
        description: "Verified chat space for github.com community",
        verified: true
      }
    ];
    
    try {
      for (const bubbleTemplate of preloadedBubbles) {
        const bubbleData: BubbleMetadata = {
          ...bubbleTemplate,
          createdAt: new Date().toISOString(),
          createdBy: account.bech32Address,
          permissions: {
            read: 'public',
            write: 'verified'
          },
          settings: {
            allowAnonymous: false,
            requireVerification: true
          },
          memberCount: 0
        };
        
        console.log(`Creating preloaded bubble: ${bubbleTemplate.name}`);
        
        await client.execute(
          account.bech32Address,
          contractAddress,
          {
            Set: {
              collection: "bubble_metadata",
              document: bubbleTemplate.id,
              data: JSON.stringify(bubbleData)
            }
          },
          "auto"
        );
      }
      
      // Create example posts for GitHub bubble
      console.log("Creating example posts for GitHub bubble...");
      
      const examplePosts = [
        {
          id: "post_1",
          content: "📊 GitHub Universe 2024 was incredible! Key highlights:\n• GitHub Copilot Enterprise\n• Advanced Security features\n• New Actions workflows\n\nWhat was your favorite announcement?",
          authorAddress: "community-manager",
          authorName: "GitHub Community",
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          bubbleId: "github",
          verified: true,
          commentCount: 1,
          comments: [
            {
              id: "comment_1_1",
              content: "The security improvements are exactly what our enterprise needed!",
              authorAddress: "security-lead",
              authorName: "Maria Santos",
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              verified: true
            }
          ]
        },
        {
          id: "post_2",
          content: "💡 Quick tip: You can now use GitHub Actions to automatically update your dependencies with Dependabot. Here's a sample workflow that runs weekly checks! 🔄",
          authorAddress: "devops-expert",
          authorName: "Jamie Park",
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          bubbleId: "github",
          verified: true,
          commentCount: 2,
          comments: [
            {
              id: "comment_2_1",
              content: "This saved us so much time! Thanks for sharing 🙏",
              authorAddress: "startup-dev",
              authorName: "Taylor Kim",
              createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
              timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
              verified: true
            },
            {
              id: "comment_2_2",
              content: "Can you share the workflow file? Would love to implement this!",
              authorAddress: "junior-dev",
              authorName: "Chris Wilson",
              createdAt: new Date(Date.now() - 6.5 * 60 * 60 * 1000).toISOString(),
              timestamp: new Date(Date.now() - 6.5 * 60 * 60 * 1000).toISOString(),
              verified: false
            }
          ]
        },
        {
          id: "post_3",
          content: "🎯 GitHub Discussions vs Issues - when to use what?\n\n💬 Discussions: Community Q&A, feature requests, general talk\n🐛 Issues: Bug reports, specific tasks, actionable items\n\nThoughts?",
          authorAddress: "oss-maintainer",
          authorName: "Robin Thompson",
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          bubbleId: "github",
          verified: true,
          commentCount: 2,
          comments: [
            {
              id: "comment_3_1",
              content: "Great breakdown! I always struggled with this distinction.",
              authorAddress: "new-maintainer",
              authorName: "Sam Lee",
              createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
              timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
              verified: true
            },
            {
              id: "comment_3_2",
              content: "We use discussions for roadmap planning too - works great!",
              authorAddress: "project-lead",
              authorName: "Dana Miller",
              createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
              timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
              verified: true
            }
          ]
        }
      ];
      
      // Store posts in DocuStore
      for (const post of examplePosts) {
        // Store the post without comments (comments will be stored separately)
        const { comments, ...postWithoutComments } = post;
        
        await client.execute(
          account.bech32Address,
          contractAddress,
          {
            Set: {
              collection: "bubble_posts_github",
              document: post.id,
              data: JSON.stringify(postWithoutComments)
            }
          },
          "auto"
        );
        console.log(`Created example post: ${post.id}`);
        
        // Store comments separately for each post
        if (comments && comments.length > 0) {
          for (const comment of comments) {
            const commentData = {
              ...comment,
              postId: post.id,
              bubbleId: "github"
            };
            
            await client.execute(
              account.bech32Address,
              contractAddress,
              {
                Set: {
                  collection: `bubble_comments_github_${post.id}`,
                  document: comment.id,
                  data: JSON.stringify(commentData)
                }
              },
              "auto"
            );
            console.log(`Created comment ${comment.id} for post ${post.id}`);
          }
        }
      }
      
      console.log("Preloaded bubbles and posts created successfully");
      Alert.alert("Success", "Preloaded bubbles with example posts created!");
      
      // Refresh the bubbles list
      onRefresh();
    } catch (error) {
      console.error("Error creating preloaded bubbles:", error);
      Alert.alert("Error", "Failed to create preloaded bubbles");
    }
    
    console.log("=== END DEBUG ===");
  };

  const removeAllBubbles = async () => {
    if (!client || !account) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }
    
    Alert.alert(
      "Remove All Bubbles",
      "Are you sure you want to remove all bubbles? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove All", 
          style: "destructive",
          onPress: async () => {
            console.log("=== DEBUG: Removing all bubbles ===");
            
            try {
              const response = await queryClient?.queryContractSmart(contractAddress, {
                UserDocuments: {
                  owner: account.bech32Address,
                  collection: "bubble_metadata"
                }
              });
              
              if (response?.documents && response.documents.length > 0) {
                console.log(`Found ${response.documents.length} bubbles to remove`);
                
                for (const [documentId] of response.documents) {
                  console.log(`Removing bubble document: ${documentId}`);
                  
                  await client.execute(
                    account.bech32Address,
                    contractAddress,
                    {
                      Delete: {
                        collection: "bubble_metadata",
                        document: documentId
                      }
                    },
                    "auto"
                  );
                }
                
                console.log("All bubbles removed successfully");
                Alert.alert("Success", `Removed ${response.documents.length} bubbles!`);
              } else {
                console.log("No bubbles found to remove");
                Alert.alert("Info", "No bubbles found to remove");
              }
              
              // Also clear the bubble registry
              try {
                await client.execute(
                  account.bech32Address,
                  contractAddress,
                  {
                    Delete: {
                      collection: "bubble_registry",
                      document: "all_bubbles"
                    }
                  },
                  "auto"
                );
                console.log("Bubble registry cleared");
              } catch (error) {
                console.log("Error clearing bubble registry (may not exist):", error);
              }
              
              // Refresh the bubbles list
              onRefresh();
            } catch (error) {
              console.error("Error removing bubbles:", error);
              Alert.alert("Error", "Failed to remove some bubbles");
            }
            
            console.log("=== END DEBUG ===");
          }
        }
      ]
    );
  };

  const showCollections = async () => {
    if (!queryClient || !account) return;
    console.log("=== DEBUG: Checking all collections ===");
    
    const collectionsToCheck = [
      "bubble_metadata",
      "bubble_registry", 
      "bubble_verifications"
    ];
    
    for (const collection of collectionsToCheck) {
      try {
        const response = await queryClient.queryContractSmart(contractAddress, {
          UserDocuments: {
            owner: account.bech32Address,
            collection
          }
        });
        console.log(`Collection "${collection}":`, response);
      } catch (error) {
        console.log(`Collection "${collection}" error:`, error);
      }
    }
    console.log("=== END DEBUG ===");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: '#666' }]}
        onPress={() => {
          console.log("Manual refresh triggered");
          onRefresh();
        }}
      >
        <IconSymbol name="arrow.clockwise" size={14} color="#fff" />
        <ThemedText style={[styles.debugButtonText, { color: '#fff' }]}>
          Debug: Refresh Bubbles
        </ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: '#888' }]}
        onPress={showCollections}
      >
        <IconSymbol name="magnifyingglass" size={14} color="#fff" />
        <ThemedText style={[styles.debugButtonText, { color: '#fff' }]}>
          Debug: Show Collections
        </ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: '#4CAF50' }]}
        onPress={createPreloadedBubbles}
      >
        <IconSymbol name="plus.square.fill" size={14} color="#fff" />
        <ThemedText style={[styles.debugButtonText, { color: '#fff' }]}>
          Debug: Create Preloaded Bubbles
        </ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: '#f44336' }]}
        onPress={removeAllBubbles}
      >
        <IconSymbol name="trash.fill" size={14} color="#fff" />
        <ThemedText style={[styles.debugButtonText, { color: '#fff' }]}>
          Debug: Remove All Bubbles
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 5,
    marginTop: 10,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    gap: 5,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
