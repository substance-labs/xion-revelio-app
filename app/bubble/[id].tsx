import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, RefreshControl, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAbstraxionAccount, useAbstraxionClient } from "@/lib/abstraxion";
import { BubbleMetadata } from '@/types/bubble';

if (!process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS) {
  throw new Error("EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS is not set in your environment file");
}

type BubblePost = {
  id: string;
  text: string;
  author: string;
  timestamp: number;
};

type BubbleComment = {
  id: string;
  postId: string;
  text: string;
  author: string;
  timestamp: number;
};

export default function BubbleDetail() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const buttonColor = useThemeColor({}, 'button');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const router = useRouter();

  const { id, name } = useLocalSearchParams();
  const bubbleId = id as string;

  // Abstraxion hooks
  const { data: account, isConnected } = useAbstraxionAccount();
  const { client: queryClient } = useAbstraxionClient();

  // State
  const [bubble, setBubble] = useState<BubbleMetadata | null>(null);
  const [bubbleLoading, setBubbleLoading] = useState(true);
  const [posts, setPosts] = useState<BubblePost[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: BubbleComment[] }>({});
  const [newPostText, setNewPostText] = useState('');
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS as string;
  const collectionName = process.env.EXPO_PUBLIC_BUBBLES_COLLECTION || 'bubbles';

  // Load bubble metadata
  const loadBubble = async () => {
    setBubbleLoading(true);
    
    if (!queryClient) {
      console.log('No queryClient available');
      setBubbleLoading(false);
      return;
    }
    
    try {
      console.log('Loading bubble metadata for:', bubbleId);
      console.log('Collection name:', collectionName);
      console.log('Contract address:', contractAddress);
      
      const response = await queryClient.queryContractSmart(contractAddress, {
        Get: {
          collection: collectionName,
          document: bubbleId
        }
      });

      console.log('Raw response:', response);

      if (response?.document?.data) {
        const bubbleData = JSON.parse(response.document.data);
        setBubble(bubbleData);
        console.log('Loaded bubble:', bubbleData);
      } else if (response?.data) {
        // Fallback for different response format
        const bubbleData = JSON.parse(response.data);
        setBubble(bubbleData);
        console.log('Loaded bubble (fallback):', bubbleData);
      } else {
        console.log('No bubble data found for ID:', bubbleId);
      }
    } catch (error) {
      console.error('Error loading bubble:', error);
    } finally {
      setBubbleLoading(false);
    }
  };

  // Load bubble posts
  const loadPosts = async () => {
    setLoading(true);
    try {
      // Fetch posts from DocuStore contract
      console.log('Loading posts for bubble:', bubbleId);
      
      // TODO: Implement actual post fetching from DocuStore
      // For now, start with empty posts array
      setPosts([]);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBubble();
    loadPosts();
  }, [bubbleId, queryClient]);

  const handleCreatePost = async () => {
    if (!account || !newPostText.trim()) return;
    
    console.log('Creating post:', newPostText);
    Alert.alert('Info', 'Post creation will be implemented soon');
    setNewPostText('');
  };

  const handleAddComment = async (postId: string) => {
    if (!account || !newCommentText[postId]?.trim()) return;
    
    console.log('Adding comment to post:', postId);
    Alert.alert('Info', 'Comments will be implemented soon');
    setNewCommentText(prev => ({ ...prev, [postId]: '' }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBubble(), loadPosts()]);
    setRefreshing(false);
  };

  // Check if user can read this bubble
  const canRead = bubble?.permissions.read === 'public' || isConnected;
  
  // Show loading state while bubble metadata is loading
  if (bubbleLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={tintColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.bubbleName}>
            {name || bubbleId}
          </ThemedText>
        </View>
        
        <View style={styles.connectPrompt}>
          <ThemedText style={styles.connectText}>
            Loading bubble...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // If bubble requires connection and user is not connected
  if (!canRead) {
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
        
        <View style={styles.connectPrompt}>
          <ThemedText style={styles.connectText}>
            {/* Connect your wallet to view this private bubble */}
          </ThemedText>
        </View>
      </SafeAreaView>
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

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.postsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                No posts yet. Be the first to share something!
              </ThemedText>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={[styles.postCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={styles.postHeader}>
                  <ThemedText style={styles.authorText}>
                    {post.author}
                  </ThemedText>
                  <ThemedText style={styles.timestampText}>
                    {new Date(post.timestamp).toLocaleDateString()}
                  </ThemedText>
                </View>
                
                <ThemedText style={styles.postText}>
                  {post.text}
                </ThemedText>
              </View>
            ))
          )}
        </ScrollView>

        <View style={[styles.createPostSection, { backgroundColor: cardColor, borderColor }]}>
          {!isConnected ? (
            <View style={styles.connectToPostPrompt}>
              <ThemedText style={styles.connectToPostText}>
                Connect your wallet to join the conversation
              </ThemedText>
            </View>
          ) : (
            <>
              <TextInput
                style={[styles.textInput, { color: textColor, borderColor }]}
                placeholder="Share something with the bubble..."
                placeholderTextColor={textColor + '80'}
                value={newPostText}
                onChangeText={setNewPostText}
                multiline
                maxLength={500}
              />
              
              <TouchableOpacity
                style={[
                  styles.postButton,
                  { backgroundColor: newPostText.trim() ? buttonColor : borderColor }
                ]}
                onPress={handleCreatePost}
                disabled={!newPostText.trim()}
              >
                <ThemedText style={[
                  styles.postButtonText,
                  { color: newPostText.trim() ? buttonTextColor : textColor + '80' }
                ]}>
                  Post
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    padding: 16,
    paddingTop: 8,
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
});
