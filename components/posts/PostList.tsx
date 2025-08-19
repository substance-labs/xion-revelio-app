import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BubblePost } from '@/types/bubble';

interface PostListProps {
  posts: BubblePost[];
  onPostPress: (post: BubblePost) => void;
  onCreatePost?: () => void;
  isLoading?: boolean;
}

export function PostList({ posts, onPostPress, onCreatePost, isLoading }: PostListProps) {
  const borderColor = useThemeColor({}, 'border');
  const buttonColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'tabIconDefault');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ThemedText>Loading posts...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Create Post Button */}
      {onCreatePost && (
        <TouchableOpacity
          onPress={onCreatePost}
          style={{
            margin: 16,
            padding: 16,
            backgroundColor: buttonColor,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <ThemedText style={{ color: 'white', fontWeight: '600' }}>
            ✍️ Create New Post
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Posts List */}
      <ScrollView style={{ flex: 1 }}>
        {posts.length === 0 ? (
          <ThemedView style={{ padding: 20, alignItems: 'center' }}>
            <ThemedText style={{ color: mutedTextColor, textAlign: 'center' }}>
              No posts yet. Be the first to share something!
            </ThemedText>
          </ThemedView>
        ) : (
          posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              onPress={() => onPostPress(post)}
              style={{
                margin: 16,
                marginBottom: 8,
              }}
            >
              <ThemedView
                style={{
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderColor,
                }}
              >
                {/* Post Header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 16, marginBottom: 4 }}>
                      {post.title}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ThemedText style={{ color: mutedTextColor, fontSize: 12 }}>
                        By {truncateAddress(post.author)}
                      </ThemedText>
                      <ThemedText style={{ color: mutedTextColor, fontSize: 12, marginLeft: 8 }}>
                        {formatDate(post.createdAt)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Post Content Preview */}
                <ThemedText
                  style={{ 
                    marginBottom: 12,
                    lineHeight: 20,
                  }}
                  numberOfLines={3}
                >
                  {post.content}
                </ThemedText>

                {/* Post Tags */}
                {post.tags && post.tags.length > 0 && (
                  <View style={{ 
                    flexDirection: 'row', 
                    flexWrap: 'wrap', 
                    marginBottom: 12 
                  }}>
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: buttonColor + '20',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        <ThemedText style={{ 
                          fontSize: 12, 
                          color: buttonColor,
                          fontWeight: '500'
                        }}>
                          #{tag}
                        </ThemedText>
                      </View>
                    ))}
                    {post.tags.length > 3 && (
                      <ThemedText style={{ 
                        fontSize: 12, 
                        color: mutedTextColor,
                        alignSelf: 'center'
                      }}>
                        +{post.tags.length - 3} more
                      </ThemedText>
                    )}
                  </View>
                )}

                {/* Post Footer */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={{ color: mutedTextColor, fontSize: 12 }}>
                      💬 {post.commentCount} comments
                    </ThemedText>
                    {post.reactions && (
                      <ThemedText style={{ color: mutedTextColor, fontSize: 12, marginLeft: 16 }}>
                        👍 {post.reactions.likes} 👎 {post.reactions.dislikes}
                      </ThemedText>
                    )}
                  </View>
                  {post.updatedAt && (
                    <ThemedText style={{ color: mutedTextColor, fontSize: 10 }}>
                      Updated {formatDate(post.updatedAt)}
                    </ThemedText>
                  )}
                </View>
              </ThemedView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
