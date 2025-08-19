import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAbstraxionAccount, useAbstraxionClient, useAbstraxionSigningClient } from '@/lib/abstraxion';
import { BubblePost, PostComment, CreatePostFormData, CreateCommentFormData } from '@/types/bubble';
import { PostService, createPostService } from '@/services/postService';

export function usePosts(bubbleId?: string) {
  const [posts, setPosts] = useState<BubblePost[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: PostComment[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionClient(); // For read-only operations
  const { client: signingClient } = useAbstraxionSigningClient(); // For write operations

  // Create the post service instance for write operations
  const postService = useMemo(() => {
    if (!signingClient || !account) {
      return null;
    }

    const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error('DocuStore contract address not configured');
      return null;
    }
    
    return createPostService({
      client: signingClient,
      account,
      contractAddress,
    });
  }, [signingClient, account]);

  // Also create a read-only service for fetching posts
  const readOnlyPostService = useMemo(() => {
    if (!client) {
      return null;
    }

    const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error('DocuStore contract address not configured');
      return null;
    }

    return createPostService({
      client,
      account: null,
      contractAddress,
    });
  }, [client]);

  // Fetch posts for a specific bubble
  const fetchPosts = useCallback(async (targetBubbleId?: string) => {
    const serviceToUse = readOnlyPostService || postService;
    const bubbleToFetch = targetBubbleId || bubbleId;
    
    if (!serviceToUse || !bubbleToFetch) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedPosts = await serviceToUse.fetchPostsByBubble(bubbleToFetch);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [readOnlyPostService, postService, bubbleId]);

  // Fetch comments for a specific post
  const fetchComments = useCallback(async (postId: string) => {
    const serviceToUse = readOnlyPostService || postService;
    
    if (!serviceToUse) {
      return;
    }
    
    try {
      const fetchedComments = await serviceToUse.fetchCommentsByPost(postId);
      setComments(prev => ({
        ...prev,
        [postId]: fetchedComments
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [readOnlyPostService, postService]);

  // Create a new post
  const createPost = useCallback(async (formData: CreatePostFormData): Promise<BubblePost> => {
    if (!postService) {
      throw new Error('Post service not available');
    }

    try {
      const newPost = await postService.createPost(formData);
      
      // Update local state to include the new post
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      return newPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }, [postService]);

  // Create a new comment
  const createComment = useCallback(async (formData: CreateCommentFormData): Promise<PostComment> => {
    if (!postService) {
      throw new Error('Post service not available');
    }

    try {
      const newComment = await postService.createComment(formData);
      
      // Update local state to include the new comment
      setComments(prev => ({
        ...prev,
        [formData.postId]: [...(prev[formData.postId] || []), newComment]
      }));

      // Update the post's comment count in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === formData.postId 
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );
      
      return newComment;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }, [postService]);

  // Get a specific post by ID
  const getPost = useCallback(async (postId: string): Promise<BubblePost | null> => {
    const serviceToUse = readOnlyPostService || postService;
    
    if (!serviceToUse) {
      throw new Error('Post service not available');
    }

    return await serviceToUse.getPostById(postId);
  }, [readOnlyPostService, postService]);

  // Update an existing post
  const updatePost = useCallback(async (postId: string, updates: Partial<BubblePost>): Promise<BubblePost> => {
    if (!postService) {
      throw new Error('Post service not available');
    }

    const updatedPost = await postService.updatePost(postId, updates);
    
    // Update local state
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? updatedPost : post
      )
    );
    
    return updatedPost;
  }, [postService]);

  // Delete a post
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    if (!postService) {
      throw new Error('Post service not available');
    }

    await postService.deletePost(postId);
    
    // Update local state to remove the deleted post
    setPosts(prevPosts => 
      prevPosts.filter(post => post.id !== postId)
    );

    // Remove comments for this post
    setComments(prev => {
      const updated = { ...prev };
      delete updated[postId];
      return updated;
    });
  }, [postService]);

  // Auto-fetch posts when bubbleId changes
  useEffect(() => {
    if (bubbleId) {
      fetchPosts(bubbleId);
    }
  }, [bubbleId, client]); // Only fetch when bubbleId or client changes

  return {
    // Data
    posts,
    comments,
    isLoading,
    error,
    
    // Actions
    fetchPosts,
    fetchComments,
    createPost,
    createComment,
    getPost,
    updatePost,
    deletePost,
    
    // Service instance (for advanced use cases)
    postService,
  };
}
