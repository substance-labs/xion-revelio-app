export type BubbleMetadata = {
  id: string;
  name: string;
  description: string;
  domain: string;
  createdAt: string;
  createdBy: string;
  permissions: {
    read: 'public';
    write: 'public' | 'admins';
  };
  memberCount?: number;
};

export type CreateBubbleFormData = {
  name: string;
  description: string;
  domain: string;
  permissions: {
    read: 'public';
    write: 'public' | 'admins';
  };
};
