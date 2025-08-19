import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BubblePost, PostComment, CreateCommentFormData } from '@/types/bubble';

interface PostDetailProps {
  post: BubblePost;
  comments: PostComment[];
  onAddComment: (data: CreateCommentFormData) => Promise<void>;
  onFetchComments: (postId: string) => Promise<void>;
  onBack: () => void;
  isSubmittingComment?: boolean;
}

export function PostDetail({ 
  post, 
  comments, 
  onAddComment, 
  onFetchComments, 
  onBack, 
  isSubmittingComment 
}: PostDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const buttonColor = useThemeColor({}, 'tint');
  const mutedTextColor = useThemeColor({}, 'tabIconDefault');

  useEffect(() => {
    onFetchComments(post.id);
  }, [post.id, onFetchComments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    const commentData: CreateCommentFormData = {
      postId: post.id,
      bubbleId: post.bubbleId,
      content: newComment.trim(),
      parentCommentId: replyToComment || undefined,
    };

    try {
      await onAddComment(commentData);
      setNewComment('');
      setReplyToComment(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  const handleReply = (commentId: string) => {
    setReplyToComment(commentId);
  };

  const cancelReply = () => {
    setReplyToComment(null);
  };

  // Organize comments into threads
  const topLevelComments = comments.filter(comment => !comment.parentCommentId);
  const repliesMap = comments.reduce((acc, comment) => {
    if (comment.parentCommentId) {
      if (!acc[comment.parentCommentId]) {
        acc[comment.parentCommentId] = [];
      }
      acc[comment.parentCommentId].push(comment);
    }
    return acc;
  }, {} as { [key: string]: PostComment[] });

  const renderComment = (comment: PostComment, level: number = 0) => {
    const replies = repliesMap[comment.id] || [];
    const marginLeft = level * 20;

    return (
      <View key={comment.id} style={{ marginLeft }}>
        <ThemedView style={{
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: borderColor,
          marginBottom: 8,
        }}>
          {/* Comment Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <ThemedText style={{ color: mutedTextColor, fontSize: 12 }}>
              {truncateAddress(comment.author)}
            </ThemedText>
            <ThemedText style={{ color: mutedTextColor, fontSize: 10 }}>
              {formatDate(comment.createdAt)}
            </ThemedText>
          </View>

          {/* Comment Content */}
          <ThemedText style={{ lineHeight: 20, marginBottom: 8 }}>
            {comment.content}
          </ThemedText>

          {/* Reply Button */}
          {level < 2 && ( // Limit nesting to 2 levels
            <TouchableOpacity 
              onPress={() => handleReply(comment.id)}
              style={{ alignSelf: 'flex-start' }}
            >
              <ThemedText style={{ 
                color: buttonColor, 
                fontSize: 12, 
                fontWeight: '500' 
              }}>
                Reply
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Render replies */}
        {replies.map(reply => renderComment(reply, level + 1))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 16 }}>
          <ThemedText style={{ color: buttonColor, fontSize: 16 }}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
          Post Details
        </ThemedText>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Post Content */}
        <ThemedView style={{
          margin: 16,
          padding: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: borderColor,
        }}>
          {/* Post Header */}
          <ThemedText type="title" style={{ marginBottom: 8 }}>
            {post.title}
          </ThemedText>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <ThemedText style={{ color: mutedTextColor, fontSize: 12 }}>
              By {truncateAddress(post.author)}
            </ThemedText>
            <ThemedText style={{ color: mutedTextColor, fontSize: 12 }}>
              {formatDate(post.createdAt)}
            </ThemedText>
          </View>

          {/* Post Content */}
          <ThemedText style={{ lineHeight: 22, marginBottom: 16 }}>
            {post.content}
          </ThemedText>

          {/* Post Tags */}
          {post.tags && post.tags.length > 0 && (
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              marginBottom: 16 
            }}>
              {post.tags.map((tag, index) => (
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
            </View>
          )}

          {/* Post Stats */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <ThemedText style={{ color: mutedTextColor, fontSize: 12 }}>
              💬 {post.commentCount} comments
            </ThemedText>
            {post.reactions && (
              <ThemedText style={{ color: mutedTextColor, fontSize: 12, marginLeft: 16 }}>
                👍 {post.reactions.likes} 👎 {post.reactions.dislikes}
              </ThemedText>
            )}
          </View>
        </ThemedView>

        {/* Comments Section */}
        <View style={{ margin: 16 }}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 16, fontSize: 18 }}>
            Comments ({comments.length})
          </ThemedText>

          {/* Add Comment Form */}
          <ThemedView style={{
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: borderColor,
            marginBottom: 16,
          }}>
            {replyToComment && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                padding: 8,
                backgroundColor: buttonColor + '10',
                borderRadius: 4,
              }}>
                <ThemedText style={{ color: buttonColor, fontSize: 12 }}>
                  Replying to comment...
                </ThemedText>
                <TouchableOpacity onPress={cancelReply}>
                  <ThemedText style={{ color: mutedTextColor, fontSize: 12 }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor={mutedTextColor}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: textColor,
                backgroundColor: backgroundColor,
                marginBottom: 12,
                height: 80,
              }}
              maxLength={500}
            />

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <ThemedText style={{ fontSize: 12, color: mutedTextColor }}>
                {newComment.length}/500
              </ThemedText>
              
              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={isSubmittingComment || !newComment.trim()}
                style={{
                  backgroundColor: (!newComment.trim() || isSubmittingComment) 
                    ? mutedTextColor 
                    : buttonColor,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <ThemedText style={{ 
                  color: 'white', 
                  fontWeight: '500',
                  fontSize: 14 
                }}>
                  {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

          {/* Comments List */}
          {topLevelComments.length === 0 ? (
            <ThemedView style={{
              padding: 20,
              alignItems: 'center',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: borderColor,
            }}>
              <ThemedText style={{ color: mutedTextColor, textAlign: 'center' }}>
                No comments yet. Be the first to comment!
              </ThemedText>
            </ThemedView>
          ) : (
            topLevelComments.map(comment => renderComment(comment))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
