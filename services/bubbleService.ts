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
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.description === 'string' &&
      typeof data.domain === 'string' &&
      typeof data.createdAt === 'string' &&
      typeof data.createdBy === 'string' &&
      data.permissions &&
      (data.permissions.read === 'public' || data.permissions.read === 'verified') &&
      (data.permissions.write === 'public' || data.permissions.write === 'admins' || data.permissions.write === 'verified')
    );
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
            console.warn(`Invalid bubble data for ${key}:`, bubbleData);
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

    try {
      const bubbleData: BubbleMetadata = {
        id: `bubble_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        domain: formData.domain,
        createdAt: new Date().toISOString(),
        createdBy: this.account.bech32Address,
        permissions: formData.permissions,
        verification: formData.verification,
        verifications: [],
        memberCount: 1
      };

      await this.client.execute(
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
      console.log(`Fetching bubble by ID: ${bubbleId}`);
      
      const response = await this.client.queryContractSmart(this.contractAddress, {
        Get: {
          collection: this.collectionName,
          document: bubbleId
        }
      });

      if (!response?.data) {
        console.log(`No bubble found with ID: ${bubbleId}`);
        return null;
      }

      const bubbleData = JSON.parse(response.data);
      console.log(`Found bubble:`, bubbleData);
      
      return bubbleData;
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

    try {
      console.log(`Updating bubble ${bubbleId}:`, updates);
      
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

      console.log('Successfully updated bubble:', bubbleId);
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

    try {
      console.log(`Deleting bubble: ${bubbleId}`);
      
      // First, check if bubble exists and user owns it
      const bubble = await this.getBubbleById(bubbleId);
      if (!bubble) {
        throw new Error(`Bubble ${bubbleId} not found`);
      }

      if (bubble.createdBy !== this.account.bech32Address) {
        throw new Error('You can only delete bubbles you created');
      }

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

      console.log('Successfully deleted bubble:', bubbleId);
    } catch (error) {
      console.error(`Error deleting bubble ${bubbleId}:`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create a BubbleService instance
 */
export function createBubbleService(dependencies: BubbleServiceDependencies): BubbleService {
  return new BubbleService(dependencies);
}
