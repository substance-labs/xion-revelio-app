export type BubbleMetadata = {
  id: string;
  name: string;
  description: string;
  verified: boolean;
  createdAt: string;
  createdBy: string;
  permissions: {
    read: 'public' | 'verified';
    write: 'public' | 'verified' | 'admins';
  };
  settings: {
    allowAnonymous: boolean;
    requireVerification: boolean;
  };
  memberCount?: number;
};

export type UserVerification = {
  userId: string;
  bubbleId: string;
  verified: boolean;
  verifiedAt: string;
};

export type CreateBubbleFormData = {
  name: string;
  description: string;
  domain: string;
  permissions: {
    read: 'public' | 'verified';
    write: 'public' | 'verified' | 'admins';
  };
  settings: {
    allowAnonymous: boolean;
    requireVerification: boolean;
  };
};
