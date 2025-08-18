import { BubbleVerification, VerificationResult, VerificationRequest } from '@/types/bubble';

export interface VerificationServiceDependencies {
  client: any;
  signingClient?: any;
  account: { bech32Address: string } | null;
  contractAddress: string;
  collectionName?: string;
}

/**
 * Web implementation of VerificationService 
 * Stub implementation - verification not supported on web yet
 */
export class VerificationService {
  constructor(dependencies: VerificationServiceDependencies) {
    // Stub implementation
  }

  async isUserVerified(bubbleId: string, walletAddress: string): Promise<boolean> {
    return false;
  }

  async getUserVerification(bubbleId: string, walletAddress: string): Promise<BubbleVerification | null> {
    return null;
  }

  async startVerification(request: VerificationRequest): Promise<VerificationResult> {
    return {
      success: false,
      error: 'Web verification not yet implemented. Please use the mobile app for verification.'
    };
  }

  async removeVerification(bubbleId: string, walletAddress: string): Promise<void> {
    throw new Error('Web verification not supported');
  }

  async getVerifiedUsers(bubbleId: string): Promise<BubbleVerification[]> {
    return [];
  }

  async checkAccess(bubbleId: string, walletAddress: string, action: 'read' | 'write'): Promise<boolean> {
    // For web, allow public access only
    return true; // This should be handled by the bubble permissions
  }

  getAvailableProviders(): string[] {
    return [];
  }

  isVerificationSupported(): boolean {
    return false;
  }

  isReclaimAvailable(): boolean {
    return false;
  }

  getVerificationStatusMessage(): string {
    return 'Web verification not yet supported. Please use the mobile app for verification.';
  }
}

export function createVerificationService(dependencies: VerificationServiceDependencies): VerificationService {
  return new VerificationService(dependencies);
}

export function createPlatformVerificationService(dependencies: VerificationServiceDependencies): VerificationService {
  return new VerificationService(dependencies);
}

export * from '@/types/bubble';
