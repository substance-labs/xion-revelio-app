// ZK Proof verification types based on ReclaimProtocol
export type ReclaimClaimInfo = {
  provider: string;
  parameters: string;
  context: string;
};

export type ReclaimSignedClaim = {
  claim: {
    identifier: string;
    owner: string;
    epoch: number;
    timestampS: number;
  };
  signatures: string[];
};

export type ReclaimProof = {
  claimInfo: ReclaimClaimInfo;
  signedClaim: ReclaimSignedClaim;
};

export type BubbleVerification = {
  walletAddress: string;
  proof: ReclaimProof;
  verifiedAt: string;
  provider: string; // e.g., 'twitter', 'github', etc.
};

export type BubbleMetadata = {
  id: string;
  name: string;
  description: string;
  domain: string;
  createdAt: string;
  createdBy: string;
  permissions: {
    read: 'public' | 'verified';
    write: 'public' | 'admins' | 'verified';
  };
  verification?: {
    required: boolean;
    providers: string[]; // Available verification providers for this bubble
  };
  verifications?: BubbleVerification[]; // List of verified users
  memberCount?: number;
};

export type CreateBubbleFormData = {
  name: string;
  description: string;
  domain: string;
  permissions: {
    read: 'public' | 'verified';
    write: 'public' | 'admins' | 'verified';
  };
  verification?: {
    required: boolean;
    providers: string[];
  };
};

// Verification flow types
export type VerificationRequest = {
  bubbleId: string;
  provider: string;
  walletAddress: string;
};

export type VerificationResult = {
  success: boolean;
  proof?: ReclaimProof;
  error?: string;
};
