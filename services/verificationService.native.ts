import { Platform } from 'react-native';
import { ReclaimVerification } from '@reclaimprotocol/inapp-rn-sdk';
import { BubbleVerification, ReclaimProof, VerificationResult, VerificationRequest, VerificationProvider } from '@/types/bubble';

export interface VerificationServiceDependencies {
  client: any; // Query client for reads
  signingClient?: any; // Signing client for transactions (optional)
  account: { bech32Address: string } | null;
  contractAddress: string;
  collectionName?: string;
}

/**
 * Native implementation of verification service using ReclaimProtocol
 * Complete implementation for React Native platform
 */
export class VerificationService {
  private client: any;
  private signingClient: any;
  private account: { bech32Address: string } | null;
  private contractAddress: string;
  private collectionName: string;
  private reclaimVerification: any = null;

  constructor({ client, signingClient, account, contractAddress, collectionName }: VerificationServiceDependencies) {
    this.client = client;
    this.signingClient = signingClient || client; // Use signingClient for transactions, fallback to client
    this.account = account;
    this.contractAddress = contractAddress;
    this.collectionName = collectionName || process.env.EXPO_PUBLIC_BUBBLES_COLLECTION || 'bubbles';
    this.initializeReclaimClient();
  }

  private async initializeReclaimClient() {
    try {
      this.reclaimVerification = new ReclaimVerification();
    } catch (error) {
      console.error('Failed to initialize ReclaimVerification client:', error);
    }
  }

  /**
   * Check if a user is verified for a specific bubble
   */
  async isUserVerified(bubbleId: string, walletAddress: string): Promise<boolean> {
    try {
      const bubble = await this.getBubbleById(bubbleId);
      if (!bubble?.verifications) return false;

      return bubble.verifications.some((v: BubbleVerification) => v.walletAddress === walletAddress);
    } catch (error) {
      console.error('Error checking user verification:', error);
      return false;
    }
  }

  /**
   * Get verification details for a user in a bubble
   */
  async getUserVerification(bubbleId: string, walletAddress: string): Promise<BubbleVerification | null> {
    try {
      const bubble = await this.getBubbleById(bubbleId);
      if (!bubble?.verifications) return null;

      return bubble.verifications.find((v: BubbleVerification) => v.walletAddress === walletAddress) || null;
    } catch (error) {
      console.error('Error getting user verification:', error);
      return null;
    }
  }

  /**
   * Start verification process using ReclaimProtocol
   */
  async startVerification(request: VerificationRequest): Promise<VerificationResult> {
    if (!this.isReclaimAvailable()) {
      const errorMessage = this.getVerificationStatusMessage();
      return { success: false, error: errorMessage };
    }

    if (!this.account?.bech32Address) {
      return { success: false, error: 'Account not available' };
    }

    if (request.walletAddress !== this.account.bech32Address) {
      return { success: false, error: 'Wallet address mismatch' };
    }

    try {
      // Get the provider ID - request.provider should contain the provider ID
      // but we'll add a fallback to find by name if needed
      let providerId = request.provider;
      
      // If provider looks like a name instead of ID, find the corresponding ID
      if (providerId && !providerId.includes('-')) {
        const availableProviders = this.getAvailableProviders();
        const providerObj = availableProviders.find(p => p.name === providerId);
        if (providerObj) {
          providerId = providerObj.id;
        }
      }

      if (!providerId) {
        return { success: false, error: 'Invalid provider specified' };
      }
      
      // Start verification process according to official documentation
      let verificationResult;
      try {
        verificationResult = await this.reclaimVerification.startVerification({
          appId: process.env.EXPO_PUBLIC_RECLAIM_APP_ID ?? '',
          secret: process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET ?? '',
          providerId: providerId,
        });
      } catch (reclaimError: any) {
        if (reclaimError.constructor.name === 'ReclaimVerificationException') {
          const errorMessage = this.handleReclaimException(reclaimError);
          return { success: false, error: errorMessage };
        }
        
        return { 
          success: false, 
          error: reclaimError instanceof Error ? reclaimError.message : 'Reclaim verification failed' 
        };
      }

      if (!verificationResult || !verificationResult.proofs || verificationResult.proofs.length === 0) {
        return { success: false, error: 'No verification proof received' };
      }

      // Extract proof data according to the format you specified
      const proofData = verificationResult.proofs[0];
      
      const claimInfo = {
        provider: proofData.claimData.provider,
        parameters: proofData.claimData.parameters,
        context: proofData.claimData.context,
      };

      const signedClaim = {
        claim: {
          identifier: proofData.claimData.identifier,
          owner: proofData.claimData.owner,
          epoch: proofData.claimData.epoch,
          timestampS: proofData.claimData.timestampS,
        },
        signatures: proofData.signatures,
      };

      const proof: ReclaimProof = {
        claimInfo,
        signedClaim,
      };

      // Save verification to bubble
      await this.saveVerificationToBubble(request.bubbleId, {
        walletAddress: request.walletAddress,
        proof: proof,
        verifiedAt: new Date().toISOString(),
        provider: request.provider
      });

      return { success: true, proof };

    } catch (error: any) {
      if (error.constructor.name === 'ReclaimVerificationException') {
        const errorMessage = this.handleReclaimException(error);
        return { success: false, error: errorMessage };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }

  /**
   * Handle ReclaimVerification exceptions according to official documentation
   */
  private handleReclaimException(error: any): string {
    // These exception types should match the official SDK
    switch (error.type) {
      case 'Cancelled':
        return 'Verification was cancelled by user';
      case 'Dismissed':
        return 'Verification was dismissed';
      case 'SessionExpired':
        return 'Verification session expired';
      case 'Failed':
      default:
        return error.reason || 'Verification failed';
    }
  }

  /**
   * Save verification proof to bubble document in DocuStore
   */
  private async saveVerificationToBubble(bubbleId: string, verification: BubbleVerification): Promise<void> {
    if (!this.signingClient || !this.account?.bech32Address) {
      throw new Error('Signing client or account not available');
    }

    try {
      // Get current bubble data
      const bubble = await this.getBubbleById(bubbleId);
      if (!bubble) {
        throw new Error(`Bubble ${bubbleId} not found`);
      }

      // Add or update verification
      const verifications = bubble.verifications || [];
      const existingIndex = verifications.findIndex((v: BubbleVerification) => v.walletAddress === verification.walletAddress);
      
      if (existingIndex >= 0) {
        verifications[existingIndex] = verification;
      } else {
        verifications.push(verification);
      }

      // Update bubble with new verification
      const updatedBubble = {
        ...bubble,
        verifications
      };

      await this.signingClient.execute(
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

    } catch (error) {
      console.error('Error saving verification to bubble:', error);
      throw error;
    }
  }

  /**
   * Get bubble by ID (helper method)
   */
  private async getBubbleById(bubbleId: string): Promise<any> {
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

      if (!response?.document?.data) {
        if (!response?.data) {
          return null;
        }
        return JSON.parse(response.data);
      }

      return JSON.parse(response.document.data);
    } catch (error) {
      console.error(`Error fetching bubble ${bubbleId}:`, error);
      throw error;
    }
  }

  /**
   * Remove verification for a user (admin function)
   */
  async removeVerification(bubbleId: string, walletAddress: string): Promise<void> {
    if (!this.signingClient || !this.account?.bech32Address) {
      throw new Error('Signing client or account not available');
    }

    try {
      const bubble = await this.getBubbleById(bubbleId);
      if (!bubble) {
        throw new Error(`Bubble ${bubbleId} not found`);
      }

      // Check if user is admin
      if (bubble.createdBy !== this.account.bech32Address) {
        throw new Error('Only bubble admins can remove verifications');
      }

      // Remove verification
      const verifications = (bubble.verifications || []).filter(
        (v: BubbleVerification) => v.walletAddress !== walletAddress
      );

      const updatedBubble = {
        ...bubble,
        verifications
      };

      // Save to DocuStore using signing client
      await this.signingClient.execute(
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

      console.log(`Verification removed for user ${walletAddress} in bubble ${bubbleId}`);
    } catch (error) {
      console.error('Error removing verification:', error);
      throw error;
    }
  }

  /**
   * Get all verified users for a bubble
   */
  async getVerifiedUsers(bubbleId: string): Promise<BubbleVerification[]> {
    try {
      const bubble = await this.getBubbleById(bubbleId);
      return bubble?.verifications || [];
    } catch (error) {
      console.error('Error getting verified users:', error);
      return [];
    }
  }

  /**
   * Check if user has access to read/write based on permissions and verification
   */
  async checkAccess(bubbleId: string, walletAddress: string, action: 'read' | 'write'): Promise<boolean> {
    try {
      if (!walletAddress || walletAddress.trim() === '') {
        const bubble = await this.getBubbleById(bubbleId);
        return bubble ? bubble.permissions[action] === 'public' : false;
      }

      const bubble = await this.getBubbleById(bubbleId);
      if (!bubble) {
        return false;
      }

      const permission = bubble.permissions[action];
      
      if (permission === 'public') {
        return true;
      }
      
      if (permission === 'admins' && bubble.createdBy === walletAddress) {
        return true;
      }
      
      if (permission === 'verified') {
        return await this.isUserVerified(bubbleId, walletAddress);
      }

      return false;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  /**
   * Check if Reclaim verification is available and ready to use
   */
  isReclaimAvailable(): boolean {    
    if (!this.reclaimVerification) {
      return false;
    }
    
    if (!this.account?.bech32Address) {
      return false;
    }
    
    if (!this.client || !this.signingClient) {
      return false;
    }
    
    return true;
  }

  /**
   * Get available verification providers
   */
  getAvailableProviders(): VerificationProvider[] {
    return [
      { name: 'github', id: '6d3f6753-7ee6-49ee-a545-62f1b1822ae5' },
      { name: 'gmail', id: 'f9f383fd-32d9-4c54-942f-5e9fda349762' },
      { name: 'strava', id: 'e7af7066-3dcb-4976-b6ed-e278a6365d3d' },
      { name: 'linkedin', id: 'a9f1063c-06b7-476a-8410-9ff6e427e637' },
      { name: 'twitter', id: 'e6fe962d-8b4e-4ce5-abcc-3d21c88bd64a' }
    ];
  }

  /**
   * Check if verification is supported on this platform
   */
  isVerificationSupported(): boolean {
    return this.isReclaimAvailable();
  }

  /**
   * Get verification status message
   */
  getVerificationStatusMessage(): string {    
    if (!this.reclaimVerification) {
      return 'ReclaimVerification client not initialized';
    }
    
    if (!this.account?.bech32Address) {
      return 'Please connect your wallet to use verification';
    }
    
    if (!process.env.EXPO_PUBLIC_RECLAIM_APP_ID || !process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET) {
      return 'Reclaim credentials not configured';
    }
    
    return 'Verification ready';
  }
}

export function createVerificationService(dependencies: VerificationServiceDependencies): VerificationService {
  return new VerificationService(dependencies);
}

export function createPlatformVerificationService(dependencies: VerificationServiceDependencies): VerificationService {
  return new VerificationService(dependencies);
}

// Export all types for consistency
export * from '@/types/bubble';
