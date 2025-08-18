import { Platform } from 'react-native';
import { ReclaimVerification } from '@reclaimprotocol/inapp-rn-sdk';
import { BubbleVerification, ReclaimProof, VerificationResult, VerificationRequest } from '@/types/bubble';

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
      // Initialize Reclaim verification instance
      this.reclaimVerification = new ReclaimVerification();
      console.log('ReclaimVerification client initialized');
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
    console.log('[VerificationService] Starting verification process');
    
    // Check if Reclaim is available before proceeding
    if (!this.isReclaimAvailable()) {
      const errorMessage = this.getVerificationStatusMessage();
      console.error('[VerificationService] Reclaim not available:', errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!this.account?.bech32Address) {
      return { success: false, error: 'Account not available' };
    }

    if (request.walletAddress !== this.account.bech32Address) {
      return { success: false, error: 'Wallet address mismatch' };
    }

    try {
      
      // Start verification process according to official documentation
      let verificationResult;
      try {
        verificationResult = await this.reclaimVerification.startVerification({
          appId: process.env.EXPO_PUBLIC_RECLAIM_APP_ID ?? '',
          secret: process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET ?? '',
          providerId: process.env.EXPO_PUBLIC_RECLAIM_PROVIDER_ID ?? '',
        });
      } catch (reclaimError: any) {
        console.error('[VerificationService] Reclaim startVerification failed:', reclaimError);
        
        // Handle specific Reclaim errors
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

      console.log('Verification successful:', proof);
      return { success: true, proof };

    } catch (error: any) {
      console.error('Verification failed:', error);
      
      // Handle ReclaimVerification exceptions according to documentation
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

      console.log(`Verification saved for user ${verification.walletAddress} in bubble ${bubbleId}`);
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
      console.error('[VerificationService] Client not available for getBubbleById');
      throw new Error('Client not available');
    }

    try {
      console.log(`[VerificationService] Querying bubble ${bubbleId} from contract ${this.contractAddress}`);
      console.log(`[VerificationService] Collection: ${this.collectionName}`);
      console.log(`[VerificationService] Client type:`, typeof this.client);
      
      const response = await this.client.queryContractSmart(this.contractAddress, {
        Get: {
          collection: this.collectionName,
          document: bubbleId
        }
      });

      console.log(`[VerificationService] Raw response for bubble ${bubbleId}:`, response);

      if (!response?.document?.data) {
        // Try fallback format in case response structure is different
        if (!response?.data) {
          console.log(`[VerificationService] No data found for bubble ${bubbleId}`);
          return null;
        }
        console.log(`[VerificationService] Using fallback response format for bubble ${bubbleId}`);
        return JSON.parse(response.data);
      }

      console.log(`[VerificationService] Parsing document data for bubble ${bubbleId}`);
      return JSON.parse(response.document.data);
    } catch (error) {
      console.error(`[VerificationService] Error fetching bubble ${bubbleId}:`, error);
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
      console.log(`[VerificationService] checkAccess called with bubbleId: ${bubbleId}, walletAddress: "${walletAddress}", action: ${action}`);
      
      // If no wallet address provided, only allow public read access
      if (!walletAddress || walletAddress.trim() === '') {
        console.log(`[VerificationService] No wallet address provided, checking for public ${action} access`);
        const bubble = await this.getBubbleById(bubbleId);
        if (!bubble) {
          console.log(`[VerificationService] Bubble ${bubbleId} not found`);
          return false;
        }
        const result = bubble.permissions[action] === 'public';
        console.log(`[VerificationService] Public access check result: ${result}`);
        return result;
      }

      console.log(`[VerificationService] Getting bubble for access check...`);
      const bubble = await this.getBubbleById(bubbleId);
      if (!bubble) {
        console.log(`[VerificationService] Bubble ${bubbleId} not found`);
        return false;
      }

      const permission = bubble.permissions[action];
      console.log(`[VerificationService] Required permission level: ${permission}`);
      
      // Public access
      if (permission === 'public') {
        console.log(`[VerificationService] Public access granted`);
        return true;
      }
      
      // Admin access
      if (permission === 'admins' && bubble.createdBy === walletAddress) {
        console.log(`[VerificationService] Admin access granted`);
        return true;
      }
      
      // Verified access
      if (permission === 'verified') {
        console.log(`[VerificationService] Checking if user ${walletAddress} is verified for bubble ${bubbleId}`);
        const isVerified = await this.isUserVerified(bubbleId, walletAddress);
        console.log(`[VerificationService] User verification status: ${isVerified}`);
        return isVerified;
      }

      console.log(`[VerificationService] No access granted`);
      return false;
    } catch (error) {
      console.error('[VerificationService] Error checking access:', error);
      return false;
    }
  }

  /**
   * Check if Reclaim verification is available and ready to use
   */
  isReclaimAvailable(): boolean {    
    if (!this.reclaimVerification) {
      console.log('[VerificationService] ReclaimVerification client not initialized');
      return false;
    }
    
    if (!this.account?.bech32Address) {
      console.log('[VerificationService] No wallet account available');
      return false;
    }
    
    console.log('[VerificationService] Reclaim verification is available');
    return true;
  }

  /**
   * Get available verification providers
   */
  getAvailableProviders(): string[] {
    return ['twitter', 'github', 'google'];
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
    if (Platform.OS === 'web') {
      return 'Verification not supported on web platform';
    }
    
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

/**
 * Factory function to create a VerificationService instance
 */
export function createVerificationService(dependencies: VerificationServiceDependencies): VerificationService {
  return new VerificationService(dependencies);
}

// Platform-aware factory function that creates the appropriate verification service
export function createPlatformVerificationService(dependencies: VerificationServiceDependencies) {
  return createVerificationService(dependencies);
}

// Export all types for consistency
export * from '@/types/bubble';
