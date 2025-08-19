import { BubbleVerification, VerificationResult, VerificationRequest, VerificationProvider } from '@/types/bubble';

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

  isReady(): boolean {
    return false; // Web version is not ready for verification
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

  getAvailableProviders(): VerificationProvider[] {
    return [
      { name: 'github', id: '6d3f6753-7ee6-49ee-a545-62f1b1822ae5' },
      { name: 'gmail', id: 'f9f383fd-32d9-4c54-942f-5e9fda349762' },
      { name: 'strava', id: 'e7af7066-3dcb-4976-b6ed-e278a6365d3d' },
      { name: 'linkedin', id: 'a9f1063c-06b7-476a-8410-9ff6e427e637' },
      { name: 'twitter', id: 'e6fe962d-8b4e-4ce5-abcc-3d21c88bd64a' }
    ];
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
