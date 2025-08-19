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

export type VerificationProvider = {
  name: string;
  id: string;
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
  createdAt: string;
  createdBy: string;
  permissions: {
    read: 'public' | 'verified';
    write: 'public' | 'admins' | 'verified';
  };
  verification?: {
    required?: boolean;
    providers: VerificationProvider[]; // Available verification providers for this bubble
  };
  verifications?: BubbleVerification[]; // List of verified users
  memberCount?: number;
  postCount?: number; // Number of posts in the bubble
};

export type CreateBubbleFormData = {
  name: string;
  description: string;
  permissions: {
    read: 'public' | 'verified';
    write: 'public' | 'admins' | 'verified';
  };
  verification?: {
    required?: boolean;
    provider?: VerificationProvider; // Single provider selection for creation
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

// Post and Comment types
export type PostComment = {
  id: string;
  postId: string;
  bubbleId: string;
  content: string;
  author: string; // wallet address
  createdAt: string;
  parentCommentId?: string; // for nested replies
};

export type BubblePost = {
  id: string;
  bubbleId: string;
  title: string;
  content: string;
  author: string; // wallet address
  createdAt: string;
  updatedAt?: string;
  commentCount: number;
  tags?: string[];
  reactions?: {
    likes: number;
    dislikes: number;
  };
};

export type CreatePostFormData = {
  bubbleId: string;
  title: string;
  content: string;
  tags?: string[];
};

export type CreateCommentFormData = {
  postId: string;
  bubbleId: string;
  content: string;
  parentCommentId?: string;
};
