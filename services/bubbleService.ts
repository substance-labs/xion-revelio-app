import { BubbleMetadata, CreateBubbleFormData } from '@/types/bubble';

interface BubbleServiceDependencies {
  client: any; // The Abstraxion client handles both querying and signing
  account: { bech32Address: string } | null;
  contractAddress: string;
  collectionName?: string; // Optional, defaults to env variable
}

export class BubbleService {
  private client: any;
  private account: { bech32Address: string } | null;
  private contractAddress: string;
  private collectionName: string;

  constructor({ client, account, contractAddress, collectionName }: BubbleServiceDependencies) {
    this.client = client;
    this.account = account;
    this.contractAddress = contractAddress;
    this.collectionName = collectionName || process.env.EXPO_PUBLIC_BUBBLES_COLLECTION || 'bubbles';
  }

  /**
   * Validate that an object conforms to BubbleMetadata type
   */
  private isValidBubbleMetadata(data: any): data is BubbleMetadata {
    const isValid = (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.description === 'string' &&
      typeof data.createdAt === 'string' &&
      typeof data.createdBy === 'string' &&
      data.permissions &&
      (data.permissions.read === 'public' || data.permissions.read === 'verified') &&
      (data.permissions.write === 'public' || data.permissions.write === 'admins' || data.permissions.write === 'verified') &&
      // Validation for verification field - it's optional, but if present, must have providers array
      (!data.verification || (
        data.verification &&
        Array.isArray(data.verification.providers) &&
        data.verification.providers.every((p: any) => 
          p && typeof p.name === 'string' && typeof p.id === 'string'
        ) &&
        // The 'required' field is optional and can be boolean or undefined
        (data.verification.required === undefined || typeof data.verification.required === 'boolean')
      ))
    );
    
    if (!isValid) {
      console.warn(`Invalid bubble metadata for: ${data?.id || 'unknown'}`);
    }
    
    return isValid;
  }

  /**
   * Fetch all bubbles in the collection (for discovery and joining)
   * This method doesn't require authentication - anyone can browse bubbles
   */
  async fetchAllBubbles(): Promise<BubbleMetadata[]> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    try {
      const response = await this.client.queryContractSmart(this.contractAddress, {
        Collection: {
          collection: this.collectionName
        }
      });

      if (!response?.documents) {
        return [];
      }
      
      const bubbles: BubbleMetadata[] = [];
      
      response.documents.forEach(([key, doc]: [string, any]) => {
        try {
          const bubbleData = JSON.parse(doc.data);

          if (this.isValidBubbleMetadata(bubbleData)) {
            bubbles.push(bubbleData as BubbleMetadata);
          } else {
            console.warn(`Invalid bubble data for ${key}, skipping`);
          }
        } catch (parseError) {
          console.error(`Error parsing bubble data for ${key}:`, parseError);
        }
      });

      return bubbles;
    } catch (error) {
      console.error('Error fetching all bubbles:', error);
      throw error;
    }
  }

  /**
   * Fetch bubbles owned by the current user
   */
  async fetchUserBubbles(): Promise<BubbleMetadata[]> {
    if (!this.account?.bech32Address) {
      return [];
    }

    try {
      const response = await this.client.queryContractSmart(this.contractAddress, {
        UserDocuments: {
          owner: this.account.bech32Address,
          collection: this.collectionName
        }
      });

      if (!response?.documents) {
        return [];
      }
      
      const bubbles: BubbleMetadata[] = [];
      
      response.documents.forEach(([key, doc]: [string, any]) => {
        try {
          const bubbleData = JSON.parse(doc.data);
          
          if (this.isValidBubbleMetadata(bubbleData)) {
            bubbles.push(bubbleData as BubbleMetadata);
          } else {
            console.warn(`Invalid bubble data for ${key}:`, bubbleData);
          }
        } catch (parseError) {
          console.error(`Error parsing bubble data for ${key}:`, parseError);
        }
      });

      return bubbles;
    } catch (error) {
      console.error('Error fetching user bubbles:', error);
      throw error;
    }
  }

  /**
   * Create a new bubble
   */
  async createBubble(formData: CreateBubbleFormData): Promise<BubbleMetadata> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    const bubbleData: BubbleMetadata = {
      id: `bubble_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      createdAt: new Date().toISOString(),
      createdBy: this.account.bech32Address,
      permissions: formData.permissions,
      verification: formData.verification?.provider ? {
        required: true,
        providers: [formData.verification.provider] // Convert single provider to array
      } : undefined,
      verifications: [],
      memberCount: 1,
      postCount: 0 // Initialize with 0 posts
    };

    try {
      const result = await this.client.execute(
        this.account.bech32Address,
        this.contractAddress,
        {
          Set: {
            collection: this.collectionName,
            document: bubbleData.id,
            data: JSON.stringify(bubbleData)
          }
        },
        "auto"
      );

      console.log('Bubble created successfully:', bubbleData.id);
      return bubbleData;
    } catch (error) {
      console.error('Error creating bubble:', error);
      throw error;
    }
  }

  /**
   * Get a specific bubble by ID
   */
  async getBubbleById(bubbleId: string): Promise<BubbleMetadata | null> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    try {
      const response = await this.client.queryContractSmart(this.contractAddress, {
        Get: {
          collection: this.collectionName,
          document: bubbleId
        }
      });

      if (!response?.data) {
        return null;
      }

      return JSON.parse(response.data);
    } catch (error) {
      console.error(`Error fetching bubble ${bubbleId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing bubble
   */
  async updateBubble(bubbleId: string, updates: Partial<BubbleMetadata>): Promise<BubbleMetadata> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    // First, get the current bubble data
    const currentBubble = await this.getBubbleById(bubbleId);
    if (!currentBubble) {
      throw new Error(`Bubble ${bubbleId} not found`);
    }

    // Check if user owns the bubble
    if (currentBubble.createdBy !== this.account.bech32Address) {
      throw new Error('You can only update bubbles you created');
    }

    // Merge updates with current data
    const updatedBubble: BubbleMetadata = {
      ...currentBubble,
      ...updates,
      id: bubbleId, // Ensure ID doesn't change
      createdBy: currentBubble.createdBy, // Ensure creator doesn't change
    };

    try {
      // Update the bubble in DocuStore
      await this.client.execute(
        this.account.bech32Address,
        this.contractAddress,
        {
          Set: {
            collection: this.collectionName,
            document: bubbleId,
            data: JSON.stringify(updatedBubble)
          }
        },
        "auto"
      );

      return updatedBubble;
    } catch (error) {
      console.error(`Error updating bubble ${bubbleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a bubble
   */
  async deleteBubble(bubbleId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    // First, check if bubble exists and user owns it
    const bubble = await this.getBubbleById(bubbleId);
    if (!bubble) {
      throw new Error(`Bubble ${bubbleId} not found`);
    }

    if (bubble.createdBy !== this.account.bech32Address) {
      throw new Error('You can only delete bubbles you created');
    }

    try {
      // Delete the bubble from DocuStore
      await this.client.execute(
        this.account.bech32Address,
        this.contractAddress,
        {
          Delete: {
            collection: this.collectionName,
            document: bubbleId
          }
        },
        "auto"
      );
    } catch (error) {
      console.error(`Error deleting bubble ${bubbleId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup test bubbles - delete ALL bubbles owned by current user
   */
  async cleanupTestBubbles(): Promise<{ deleted: string[], failed: string[] }> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    const deleted: string[] = [];
    const failed: string[] = [];

    const cleanupCollection = 'bubbles'; // Use explicit collection name

    console.log('Starting cleanup of ALL user bubbles...');
    console.log('Current user address:', this.account.bech32Address);
    console.log('Cleanup collection name:', cleanupCollection);

    try {
      // Fetch all bubbles owned by the current user
      console.log('Fetching user bubbles...');
      const response = await this.client.queryContractSmart(this.contractAddress, {
        UserDocuments: {
          owner: this.account.bech32Address,
          collection: cleanupCollection
        }
      });

      console.log('UserDocuments response:', JSON.stringify(response, null, 2));

      if (!response?.documents || response.documents.length === 0) {
        console.log('No bubbles found for user');
        return { deleted, failed };
      }

      const userBubbleIds = response.documents.map(([bubbleId]: [string, any]) => bubbleId);
      console.log('Found user bubbles:', userBubbleIds);

      // Delete each bubble
      for (const bubbleId of userBubbleIds) {
        try {
          console.log(`\n=== Attempting to delete: ${bubbleId} ===`);
          
          // Delete the bubble using the correct collection
          const deleteResult = await this.client.execute(
            this.account.bech32Address,
            this.contractAddress,
            {
              Delete: {
                collection: cleanupCollection,
                document: bubbleId
              }
            },
            "auto"
          );

          console.log(`Delete transaction result for ${bubbleId}:`, deleteResult);
          console.log(`Successfully deleted: ${bubbleId}`);
          deleted.push(bubbleId);

        } catch (error) {
          console.error(`Failed to delete ${bubbleId}:`, error);
          console.error(`Error details:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          failed.push(bubbleId);
        }
      }

    } catch (error) {
      console.error('Error fetching user bubbles:', error);
      throw error;
    }

    console.log(`\n=== Cleanup completed ===`);
    console.log(`Deleted: ${deleted.length} bubbles:`, deleted);
    console.log(`Failed: ${failed.length} bubbles:`, failed);
    return { deleted, failed };
  }
}

/**
 * Factory function to create a BubbleService instance
 */
export function createBubbleService(dependencies: BubbleServiceDependencies): BubbleService {
  return new BubbleService(dependencies);
}
