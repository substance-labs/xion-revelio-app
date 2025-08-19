import { BubblePost, PostComment, CreatePostFormData, CreateCommentFormData } from '@/types/bubble';

interface PostServiceDependencies {
  client: any; // The Abstraxion client handles both querying and signing
  account: { bech32Address: string } | null;
  contractAddress: string;
}

export class PostService {
  private client: any;
  private account: { bech32Address: string } | null;
  private contractAddress: string;
  private postsCollection: string;
  private commentsCollection: string;

  constructor({ client, account, contractAddress }: PostServiceDependencies) {
    this.client = client;
    this.account = account;
    this.contractAddress = contractAddress;
    this.postsCollection = 'posts';
    this.commentsCollection = 'comments';
  }

  /**
   * Create a new post in a bubble
   */
  async createPost(formData: CreatePostFormData): Promise<BubblePost> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    const postData: BubblePost = {
      id: `post_${Date.now()}`,
      bubbleId: formData.bubbleId,
      title: formData.title,
      content: formData.content,
      author: this.account.bech32Address,
      createdAt: new Date().toISOString(),
      commentCount: 0,
      tags: formData.tags || [],
      reactions: {
        likes: 0,
        dislikes: 0,
      },
    };

    try {
      await this.client.execute(
        this.account.bech32Address,
        this.contractAddress,
        {
          Set: {
            collection: this.postsCollection,
            document: postData.id,
            data: JSON.stringify(postData)
          }
        },
        "auto"
      );

      console.log('Post created successfully:', postData.id);
      return postData;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Fetch all posts for a specific bubble
   */
  async fetchPostsByBubble(bubbleId: string): Promise<BubblePost[]> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    try {
      const response = await this.client.queryContractSmart(this.contractAddress, {
        Collection: {
          collection: this.postsCollection
        }
      });

      if (!response?.documents) {
        return [];
      }

      const posts: BubblePost[] = [];

      response.documents.forEach(([key, doc]: [string, any]) => {
        try {
          const postData = JSON.parse(doc.data);
          
          // Filter posts by bubble ID
          if (postData.bubbleId === bubbleId && this.isValidPost(postData)) {
            posts.push(postData as BubblePost);
          }
        } catch (parseError) {
          console.error(`Error parsing post data for ${key}:`, parseError);
        }
      });

      // Sort posts by creation date (newest first)
      return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Get a specific post by ID
   */
  async getPostById(postId: string): Promise<BubblePost | null> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    try {
      const response = await this.client.queryContractSmart(this.contractAddress, {
        Get: {
          collection: this.postsCollection,
          document: postId
        }
      });

      if (!response?.data) {
        return null;
      }

      return JSON.parse(response.data);
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new comment on a post
   */
  async createComment(formData: CreateCommentFormData): Promise<PostComment> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    const commentData: PostComment = {
      id: `comment_${Date.now()}`,
      postId: formData.postId,
      bubbleId: formData.bubbleId,
      content: formData.content,
      author: this.account.bech32Address,
      createdAt: new Date().toISOString(),
      parentCommentId: formData.parentCommentId,
    };

    try {
      // Save the comment
      await this.client.execute(
        this.account.bech32Address,
        this.contractAddress,
        {
          Set: {
            collection: this.commentsCollection,
            document: commentData.id,
            data: JSON.stringify(commentData)
          }
        },
        "auto"
      );

      // Update the post's comment count
      await this.incrementCommentCount(formData.postId);

      console.log('Comment created successfully:', commentData.id);
      return commentData;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Fetch all comments for a specific post
   */
  async fetchCommentsByPost(postId: string): Promise<PostComment[]> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    try {
      const response = await this.client.queryContractSmart(this.contractAddress, {
        Collection: {
          collection: this.commentsCollection
        }
      });

      if (!response?.documents) {
        return [];
      }

      const comments: PostComment[] = [];

      response.documents.forEach(([key, doc]: [string, any]) => {
        try {
          const commentData = JSON.parse(doc.data);
          
          // Filter comments by post ID
          if (commentData.postId === postId && this.isValidComment(commentData)) {
            comments.push(commentData as PostComment);
          }
        } catch (parseError) {
          console.error(`Error parsing comment data for ${key}:`, parseError);
        }
      });

      // Sort comments by creation date (oldest first)
      return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Update a post (only by author)
   */
  async updatePost(postId: string, updates: Partial<BubblePost>): Promise<BubblePost> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    const currentPost = await this.getPostById(postId);
    if (!currentPost) {
      throw new Error(`Post ${postId} not found`);
    }

    if (currentPost.author !== this.account.bech32Address) {
      throw new Error('You can only update your own posts');
    }

    const updatedPost: BubblePost = {
      ...currentPost,
      ...updates,
      id: postId,
      author: currentPost.author,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.client.execute(
        this.account.bech32Address,
        this.contractAddress,
        {
          Set: {
            collection: this.postsCollection,
            document: postId,
            data: JSON.stringify(updatedPost)
          }
        },
        "auto"
      );

      return updatedPost;
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a post (only by author)
   */
  async deletePost(postId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not available');
    }

    if (!this.account?.bech32Address) {
      throw new Error('Account not available');
    }

    const post = await this.getPostById(postId);
    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    if (post.author !== this.account.bech32Address) {
      throw new Error('You can only delete your own posts');
    }

    try {
      await this.client.execute(
        this.account.bech32Address,
        this.contractAddress,
        {
          Delete: {
            collection: this.postsCollection,
            document: postId
          }
        },
        "auto"
      );
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Private helper to increment comment count on a post
   */
  private async incrementCommentCount(postId: string): Promise<void> {
    const post = await this.getPostById(postId);
    if (post) {
      await this.updatePost(postId, { commentCount: post.commentCount + 1 });
    }
  }

  /**
   * Validate post data
   */
  private isValidPost(data: any): data is BubblePost {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.bubbleId === 'string' &&
      typeof data.title === 'string' &&
      typeof data.content === 'string' &&
      typeof data.author === 'string' &&
      typeof data.createdAt === 'string' &&
      typeof data.commentCount === 'number'
    );
  }

  /**
   * Validate comment data
   */
  private isValidComment(data: any): data is PostComment {
    return (
      data &&
      typeof data.id === 'string' &&
      typeof data.postId === 'string' &&
      typeof data.bubbleId === 'string' &&
      typeof data.content === 'string' &&
      typeof data.author === 'string' &&
      typeof data.createdAt === 'string'
    );
  }
}

/**
 * Factory function to create a PostService instance
 */
export function createPostService(dependencies: PostServiceDependencies): PostService {
  return new PostService(dependencies);
}
