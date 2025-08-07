import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from "@burnt-labs/abstraxion-react-native";

if (!process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS) {
  throw new Error("EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS is not set in your environment file");
}

type BubblePost = {
  id: string;
  bubbleId: string;
  authorAddress: string;
  content: string;
  timestamp: string;
  edited?: string;
  commentCount: number;
};

type BubbleComment = {
  id: string;
  postId: string;
  bubbleId: string;
  authorAddress: string;
  content: string;
  timestamp: string;
  edited?: string;
};

export default function BubbleChat() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const inputColor = useThemeColor({}, 'input');
  const inputTextColor = useThemeColor({}, 'inputText');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const buttonColor = useThemeColor({}, 'button');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const tintColor = useThemeColor({}, 'tint');
  
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const bubbleId = id as string;

  // Abstraxion hooks
  const abstraxionAccount = useAbstraxionAccount();
  const abstraxionSigningClient = useAbstraxionSigningClient();
  const abstraxionClient = useAbstraxionClient();

  const { data: account, isConnected } = abstraxionAccount || {};
  const { client } = abstraxionSigningClient || {};
  const { client: queryClient } = abstraxionClient || {};

  // State
  const [posts, setPosts] = useState<BubblePost[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: BubbleComment[] }>({});
  const [newPostText, setNewPostText] = useState('');
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS as string;

  // Check if user is verified for this bubble
  const checkUserVerification = async () => {
    if (!queryClient || !account) {
      console.log("Cannot check verification: missing queryClient or account");
      console.log("queryClient:", !!queryClient, "account:", !!account);
      return;
    }

    try {
      console.log("Checking verification for user:", account.bech32Address, "bubble:", bubbleId);
      
      const response = await queryClient.queryContractSmart(contractAddress, {
        UserDocuments: {
          owner: account.bech32Address,
          collection: "bubble_verifications"
        }
      });

      console.log("Verification query response:", response);

      if (response?.documents) {
        const verification = response.documents.find(([docId]: [string, any]) => 
          docId === `${account.bech32Address}_${bubbleId}`
        );
        
        console.log("Found verification document:", verification);
        
        if (verification) {
          const [, doc] = verification;
          const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
          console.log("Verification data:", data);
          setIsUserVerified(data.verified || false);
        } else {
          console.log("No verification document found for this user/bubble combination");
          setIsUserVerified(false);
        }
      } else {
        console.log("No verification documents found");
        setIsUserVerified(false);
      }
    } catch (error) {
      console.log("User not verified for this bubble:", error);
      setIsUserVerified(false);
    }
  };

  // Fetch posts for this bubble
  const fetchPosts = async () => {
    if (!queryClient) return;

    try {
      console.log("Fetching posts for bubble:", bubbleId);
      console.log("Current user address:", account?.bech32Address);
      
      // Try to fetch posts from the current user's documents
      let allPosts: BubblePost[] = [];
      
      if (account?.bech32Address) {
        try {
          const userResponse = await queryClient.queryContractSmart(contractAddress, {
            UserDocuments: {
              owner: account.bech32Address,
              collection: `bubble_posts_${bubbleId}`
            }
          });
          
          if (userResponse?.documents) {
            const userPosts = userResponse.documents.map(([, doc]: [string, any]) => {
              const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
              return data as BubblePost;
            });
            allPosts.push(...userPosts);
            console.log("Found user posts:", userPosts.length);
          }
        } catch (error) {
          console.log("No posts found for current user:", error);
        }
      }

      // Note: Removed system posts query as "system" is not a valid bech32 address
      // In the future, we might need a different approach to fetch all posts for a bubble

      // Sort by timestamp (newest first)
      const sortedPosts = allPosts.sort((a: BubblePost, b: BubblePost) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      console.log("Total posts found:", sortedPosts.length);
      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    }
  };

  // Fetch comments for a specific post
  const fetchCommentsForPost = async (postId: string) => {
    if (!queryClient || !account?.bech32Address) return;

    try {
      const response = await queryClient.queryContractSmart(contractAddress, {
        UserDocuments: {
          owner: account.bech32Address,
          collection: `bubble_comments_${bubbleId}_${postId}`
        }
      });

      if (response?.documents) {
        const commentsData = response.documents.map(([, doc]: [string, any]) => {
          const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
          return data as BubbleComment;
        });

        // Sort by timestamp (oldest first for comments)
        const sortedComments = commentsData.sort((a: BubbleComment, b: BubbleComment) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setComments(prev => ({
          ...prev,
          [postId]: sortedComments
        }));
      }
    } catch (error) {
      console.log(`No comments found for post ${postId}:`, error);
    }
  };

  // Create a new post
  const createPost = async () => {
    console.log("=== CREATE POST DEBUG ===");
    console.log("client:", !!client);
    console.log("account:", !!account);
    console.log("newPostText:", newPostText.trim());
    console.log("isUserVerified:", isUserVerified);
    
    if (!client || !account || !newPostText.trim()) {
      console.log("Early return: missing requirements");
      return;
    }
    
    if (!isUserVerified) {
      console.log("User not verified - showing alert");
      Alert.alert("Not Verified", "You need to be verified for this bubble to post.");
      return;
    }

    setLoading(true);
    try {
      const postId = Date.now().toString();
      const post: BubblePost = {
        id: postId,
        bubbleId,
        authorAddress: account.bech32Address,
        content: newPostText.trim(),
        timestamp: new Date().toISOString(),
        commentCount: 0
      };

      console.log("Creating post with data:", post);
      console.log("Using collection:", `bubble_posts_${bubbleId}`);
      console.log("User address:", account.bech32Address);

      await client.execute(
        account.bech32Address,
        contractAddress,
        {
          Set: {
            collection: `bubble_posts_${bubbleId}`,
            document: postId,
            data: JSON.stringify(post)
          }
        },
        "auto"
      );

      console.log("Post created successfully");
      setNewPostText('');
      await fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", `Failed to create post: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create a comment
  const createComment = async (postId: string) => {
    if (!client || !account || !newCommentText[postId]?.trim()) return;
    if (!isUserVerified) {
      Alert.alert("Not Verified", "You need to be verified for this bubble to comment.");
      return;
    }

    try {
      const commentId = Date.now().toString();
      const comment: BubbleComment = {
        id: commentId,
        postId,
        bubbleId,
        authorAddress: account.bech32Address,
        content: newCommentText[postId].trim(),
        timestamp: new Date().toISOString()
      };

      await client.execute(
        account.bech32Address,
        contractAddress,
        {
          Set: {
            collection: `bubble_comments_${bubbleId}_${postId}`,
            document: commentId,
            data: JSON.stringify(comment)
          }
        },
        "auto"
      );

      setNewCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
      await fetchCommentsForPost(postId);
      
      // Update post comment count
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      ));
    } catch (error) {
      console.error("Error creating comment:", error);
      Alert.alert("Error", "Failed to create comment. Please try again.");
    }
  };

  // Toggle post expansion (show/hide comments)
  const togglePostExpansion = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        await fetchCommentsForPost(postId);
      }
    }
  };

  useEffect(() => {
    if (account?.bech32Address && queryClient) {
      checkUserVerification();
    }
  }, [account?.bech32Address, bubbleId, queryClient]);

  useEffect(() => {
    if (queryClient) {
      fetchPosts();
    }
  }, [queryClient, bubbleId, account?.bech32Address]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), checkUserVerification()]);
    setRefreshing(false);
  };

  const goBack = () => {
    router.back();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={goBack}
        >
          <IconSymbol name="arrow.left" size={24} color={tintColor} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <ThemedText type="subtitle" style={styles.bubbleName}>
            {decodeURIComponent(name as string)}
          </ThemedText>
          <View style={styles.verifiedRow}>
            <IconSymbol name="checkmark.seal.fill" size={16} color={tintColor} />
            {/* <ThemedText style={styles.verifiedText}>Verified</ThemedText> */}
            {isUserVerified && (
              <>
                {/* <ThemedText style={styles.separator}>•</ThemedText> */}
                <ThemedText style={[styles.verifiedText, { color: '#4CAF50' }]}>You're verified</ThemedText>
              </>
            )}
            {!isUserVerified && isConnected && (
              <>
                {/* <ThemedText style={styles.separator}>•</ThemedText> */}
                <ThemedText style={[styles.verifiedText, { color: '#FF5722' }]}>Not verified</ThemedText>
              </>
            )}
          </View>
          {/* Debug info */}
          {/* <ThemedText style={[styles.verifiedText, { fontSize: 10, opacity: 0.5 }]}>
            Debug: Connected: {isConnected ? 'Yes' : 'No'}, Verified: {isUserVerified ? 'Yes' : 'No'}, Bubble ID: {bubbleId}
          </ThemedText> */}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Posts List */}
        <ScrollView 
          style={styles.postsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="bubble" size={64} color={tintColor} style={styles.emptyIcon} />
              <ThemedText type="title" style={styles.emptyTitle}>
                Welcome to {decodeURIComponent(name as string)}
              </ThemedText>
              <ThemedText style={styles.emptyDescription}>
                This is a verified chat space. {isUserVerified ? 'Start a conversation!' : 'Get verified to start posting!'}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.postsList}>
              {posts.map((post) => (
                <View key={post.id} style={[styles.postCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
                  {/* Post Header */}
                  <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                      <ThemedText style={styles.authorAddress}>
                        {formatAddress(post.authorAddress)}
                      </ThemedText>
                      <ThemedText style={styles.postTime}>
                        {formatTime(post.timestamp)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Post Content */}
                  <ThemedText style={styles.postContent}>
                    {post.content}
                  </ThemedText>

                  {/* Post Actions */}
                  <View style={styles.postActions}>
                    <TouchableOpacity 
                      style={styles.commentButton}
                      onPress={() => togglePostExpansion(post.id)}
                    >
                      <IconSymbol name="bubble.right" size={16} color={tintColor} />
                      <ThemedText style={styles.commentCount}>
                        {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Comments Section */}
                  {expandedPost === post.id && (
                    <View style={styles.commentsSection}>
                      {/* Existing Comments */}
                      {comments[post.id]?.map((comment) => (
                        <View key={comment.id} style={styles.commentCard}>
                          <View style={styles.commentHeader}>
                            <ThemedText style={styles.commentAuthor}>
                              {formatAddress(comment.authorAddress)}
                            </ThemedText>
                            <ThemedText style={styles.commentTime}>
                              {formatTime(comment.timestamp)}
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.commentContent}>
                            {comment.content}
                          </ThemedText>
                        </View>
                      ))}

                      {/* New Comment Input */}
                      {isUserVerified && (
                        <View style={styles.newCommentSection}>
                          <TextInput
                            style={[
                              styles.commentInput,
                              {
                                backgroundColor: inputColor,
                                color: inputTextColor,
                                borderColor: borderColor
                              }
                            ]}
                            value={newCommentText[post.id] || ''}
                            onChangeText={(text) => setNewCommentText(prev => ({
                              ...prev,
                              [post.id]: text
                            }))}
                            placeholder="Write a comment..."
                            placeholderTextColor={placeholderColor}
                            multiline
                          />
                          <TouchableOpacity
                            style={[
                              styles.sendCommentButton,
                              (!newCommentText[post.id]?.trim()) && styles.disabledButton,
                              { backgroundColor: buttonColor }
                            ]}
                            onPress={() => createComment(post.id)}
                            disabled={!newCommentText[post.id]?.trim()}
                          >
                            <IconSymbol name="arrow.up" size={16} color={buttonTextColor} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* New Post Input */}
        {isUserVerified && (
          <View style={[styles.newPostSection, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
            <TextInput
              style={[
                styles.postInput,
                {
                  backgroundColor: inputColor,
                  color: inputTextColor,
                  borderColor: borderColor
                }
              ]}
              value={newPostText}
              onChangeText={setNewPostText}
              placeholder="Share your thoughts..."
              placeholderTextColor={placeholderColor}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newPostText.trim() || loading) && styles.disabledButton,
                { backgroundColor: buttonColor }
              ]}
              onPress={createPost}
              disabled={!newPostText.trim() || loading}
            >
              <ThemedText style={[styles.sendButtonText, { color: buttonTextColor }]}>
                {loading ? 'Posting...' : 'Post'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Not Verified Message */}
        {!isUserVerified && isConnected && (
          <View style={[styles.notVerifiedSection, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
            <ThemedText style={styles.notVerifiedText}>
              You need to be verified for this bubble to post and comment.
            </ThemedText>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={goBack}
            >
              <ThemedText style={[styles.goBackButtonText, { color: tintColor }]}>
                Go back and get verified
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  bubbleName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    opacity: 0.7,
  },
  separator: {
    fontSize: 12,
    opacity: 0.5,
    marginHorizontal: 4,
  },
  postsContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 20,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
  },
  postsList: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  postHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAddress: {
    fontSize: 14,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    marginLeft: -8,
  },
  commentCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 11,
    opacity: 0.6,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 18,
  },
  newCommentSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    maxHeight: 80,
  },
  sendCommentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPostSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  postInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  notVerifiedSection: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  notVerifiedText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  goBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  goBackButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
