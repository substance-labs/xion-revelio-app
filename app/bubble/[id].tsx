import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl, Alert, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { PostList, CreatePostForm, PostDetail } from '@/components/posts';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAbstraxionAccount, useAbstraxionClient } from "@/lib/abstraxion";
import { BubbleMetadata, BubblePost, CreatePostFormData, CreateCommentFormData } from '@/types/bubble';
import { useVerification } from '@/hooks/useVerification';
import { usePosts } from '@/hooks/usePosts';

if (!process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS) {
  throw new Error("EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS is not set in your environment file");
}

export default function BubbleDetail() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const router = useRouter();

  const { id, name } = useLocalSearchParams();
  const bubbleId = id as string;

  // Abstraxion hooks
  const { data: account, isConnected } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();

  // Posts hook
  const { 
    posts, 
    comments, 
    isLoading: postsLoading,
    error: postsError,
    fetchPosts,
    fetchComments,
    createPost,
    createComment
  } = usePosts(bubbleId);

  // Verification hook
  const { 
    checkAccess, 
    checkUserVerification, 
    startVerification, 
    isLoading: verificationLoading,
    isReclaimAvailable,
    getVerificationStatusMessage 
  } = useVerification();

  // State
  const [bubble, setBubble] = useState<BubbleMetadata | null>(null);
  const [hasReadAccess, setHasReadAccess] = useState(false);
  const [hasWriteAccess, setHasWriteAccess] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BubblePost | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS as string;
  const collectionName = process.env.EXPO_PUBLIC_BUBBLES_COLLECTION || 'bubbles';

  // Load bubble metadata and initial data
  const loadBubble = async () => {
    if (!queryClient) {
      return;
    }
    
    try {
      // Load bubble metadata
      const response = await queryClient.queryContractSmart(contractAddress, {
        Get: {
          collection: collectionName,
          document: bubbleId
        }
      });

      let bubbleData = null;
      if (response?.document?.data) {
        bubbleData = JSON.parse(response.document.data);
      } else if (response?.data) {
        bubbleData = JSON.parse(response.data);
      }

      if (bubbleData) {
        setBubble(bubbleData);
        
        // Check permissions
        await checkPermissions(bubbleData);
        
        // Check verification status
        if (account?.bech32Address) {
          const verified = await checkUserVerification(bubbleData.id);
          setIsVerified(verified);
        }
      }
    } catch (error) {
      console.error('Error loading bubble:', error);
    } finally {
      setInitialLoadComplete(true);
    }
  };

  // Helper function to check permissions
  const checkPermissions = async (bubbleData: BubbleMetadata) => {
    if (!bubbleData) return;

    try {
      const readAccess = await checkAccess(bubbleData.id, 'read');
      const writeAccess = await checkAccess(bubbleData.id, 'write');
      
      setHasReadAccess(readAccess);
      setHasWriteAccess(writeAccess);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasReadAccess(bubbleData.permissions.read === 'public');
      setHasWriteAccess(false);
    }
  };

  useEffect(() => {
    setInitialLoadComplete(false);
    loadBubble();
  }, [bubbleId]);

  useEffect(() => {
    if (queryClient && !initialLoadComplete) {
      loadBubble();
    }
  }, [queryClient]);

  const handleCreatePost = async (formData: CreatePostFormData) => {
    setIsCreatingPost(true);
    try {
      await createPost(formData);
      setShowCreatePost(false);
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleAddComment = async (formData: CreateCommentFormData) => {
    setIsAddingComment(true);
    try {
      await createComment(formData);
      Alert.alert('Success', 'Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handlePostPress = (post: BubblePost) => {
    setSelectedPost(post);
  };

  const onRefresh = async () => {
    setInitialLoadComplete(false);
    await loadBubble();
    if (bubbleId) {
      await fetchPosts(bubbleId);
    }
  };

  const canRead = hasReadAccess;

  // Show loading state while initial data is loading
  if (!initialLoadComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={tintColor} />
          </TouchableOpacity>
          <Skeleton width={120} height={24} style={{ marginLeft: 12 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <LoadingSpinner text="Loading bubble..." />
        </View>
      </SafeAreaView>
    );
  }

  // If user doesn't have read access
  if (!canRead && bubble) {
    const needsVerification = (bubble.permissions.read === 'verified' || bubble.permissions.write === 'verified');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}> 
        <View style={styles.header}> 
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> 
            <IconSymbol name="chevron.left" size={24} color={tintColor} /> 
          </TouchableOpacity> 
          <ThemedText type="title" style={styles.bubbleName}> 
            {bubble?.name || name || bubbleId} 
          </ThemedText> 
        </View> 
        <View style={styles.content}>
          <View style={styles.accessDeniedContainer}> 
            <ThemedText style={styles.accessDeniedText}> 
              {needsVerification && !isConnected
                ? 'Connect your wallet to access this bubble'
                : needsVerification
                  ? 'This bubble requires verification to access'
                  : 'You do not have access to this bubble'
              }
            </ThemedText>
            {isConnected && needsVerification && !isVerified && (
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: isReclaimAvailable() ? tintColor : borderColor,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: verificationLoading ? 0.6 : 1,
                }}
                onPress={async () => {
                  if (!isReclaimAvailable()) {
                    Alert.alert('Verification Unavailable', getVerificationStatusMessage());
                    return;
                  }
                  const result = await startVerification({
                    bubbleId: bubble.id,
                    walletAddress: account?.bech32Address || '',
                    provider: bubble.verification?.providers?.[0]?.id || '6d3f6753-7ee6-49ee-a545-62f1b1822ae5'
                  });
                  if (result.success) {
                    loadBubble();
                  } else {
                    Alert.alert('Verification Failed', result.error || 'Unknown error');
                  }
                }}
                disabled={verificationLoading || !isReclaimAvailable()}
              >
                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                  {verificationLoading ? 'Verifying...' : 'Get Verified'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show post detail modal
  if (selectedPost) {
    return (
      <Modal visible={true} animationType="slide">
        <PostDetail
          post={selectedPost}
          comments={comments[selectedPost.id] || []}
          onAddComment={handleAddComment}
          onFetchComments={fetchComments}
          onBack={() => setSelectedPost(null)}
          isSubmittingComment={isAddingComment}
        />
      </Modal>
    );
  }

  // Show create post modal
  if (showCreatePost) {
    return (
      <Modal visible={true} animationType="slide">
        <CreatePostForm
          bubbleId={bubbleId}
          onSubmit={handleCreatePost}
          onCancel={() => setShowCreatePost(false)}
          isSubmitting={isCreatingPost}
        />
      </Modal>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.bubbleName}>
          {bubble?.name || name || bubbleId}
        </ThemedText>
      </View>

      <PostList
        posts={posts}
        onPostPress={handlePostPress}
        onCreatePost={hasWriteAccess && isConnected ? () => setShowCreatePost(true) : undefined}
        isLoading={postsLoading}
      />

      {/* Show message if user can't create posts */}
      {(!isConnected || !hasWriteAccess) && (
        <ThemedView style={styles.messageContainer}>
          <ThemedText style={styles.messageText}>
            {!isConnected 
              ? 'Connect your wallet to join the conversation'
              : bubble?.permissions?.write === 'verified' && !isVerified
                ? 'Verification required to post in this bubble'
                : 'You don\'t have permission to post in this bubble'
            }
          </ThemedText>
          {bubble?.permissions?.write === 'verified' && isConnected && !isVerified && (
            <TouchableOpacity
              style={{
                marginTop: 12,
                backgroundColor: isReclaimAvailable() ? tintColor : borderColor,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                opacity: verificationLoading ? 0.6 : 1,
              }}
              onPress={async () => {
                if (!isReclaimAvailable()) {
                  Alert.alert('Verification Unavailable', getVerificationStatusMessage());
                  return;
                }
                const result = await startVerification({
                  bubbleId: bubble.id,
                  walletAddress: account?.bech32Address || '',
                  provider: bubble.verification?.providers?.[0]?.id || '6d3f6753-7ee6-49ee-a545-62f1b1822ae5'
                });
                if (result.success) {
                  await checkPermissions(bubble);
                  setIsVerified(true);
                } else {
                  Alert.alert('Verification Failed', result.error || 'Unknown error');
                }
              }}
              disabled={verificationLoading || !isReclaimAvailable()}
            >
              <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                {verificationLoading ? 'Verifying...' : 'Get Verified to Post'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 30,
  },
  backButton: {
    marginRight: 12,
  },
  bubbleName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  postsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  postCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  authorText: {
    fontWeight: '600',
  },
  timestampText: {
    opacity: 0.6,
    fontSize: 12,
    marginLeft: 'auto',
  },
  postText: {
    lineHeight: 20,
  },
  createPostSection: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    maxHeight: 100,
    minHeight: 40,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postButtonText: {
    fontWeight: '600',
  },
  connectPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  connectText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  connectToPostPrompt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  connectToPostText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  accessDeniedContainer: {
    padding: 20,
    alignItems: 'center',
  },
  accessDeniedText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContent: {
    marginTop: 20,
    gap: 12,
  },
  postsLoading: {
    padding: 20,
  },
  postsLoadingSkeleton: {
    marginTop: 16,
    gap: 12,
  },
  messageContainer: {
    padding: 16,
    alignItems: 'center',
  },
  messageText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
});
