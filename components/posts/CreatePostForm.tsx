import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CreatePostFormData } from '@/types/bubble';

interface CreatePostFormProps {
  bubbleId: string;
  onSubmit: (data: CreatePostFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CreatePostForm({ bubbleId, onSubmit, onCancel, isSubmitting }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const buttonColor = useThemeColor({}, 'tint');
  const mutedTextColor = useThemeColor({}, 'tabIconDefault');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    const formData: CreatePostFormData = {
      bubbleId,
      title: title.trim(),
      content: content.trim(),
      tags: tags.trim() ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined,
    };

    try {
      await onSubmit(formData);
      // Reset form
      setTitle('');
      setContent('');
      setTags('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create post');
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 20
        }}>
          <ThemedText type="title">Create New Post</ThemedText>
          <TouchableOpacity onPress={onCancel}>
            <ThemedText style={{ color: mutedTextColor }}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <View style={{ marginBottom: 16 }}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
            Title *
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter post title..."
            placeholderTextColor={mutedTextColor}
            style={{
              borderWidth: 1,
              borderColor: borderColor,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: textColor,
              backgroundColor: backgroundColor,
            }}
            maxLength={100}
          />
          <ThemedText style={{ 
            fontSize: 12, 
            color: mutedTextColor, 
            textAlign: 'right', 
            marginTop: 4 
          }}>
            {title.length}/100
          </ThemedText>
        </View>

        {/* Content Input */}
        <View style={{ marginBottom: 16 }}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
            Content *
          </ThemedText>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={mutedTextColor}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={{
              borderWidth: 1,
              borderColor: borderColor,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: textColor,
              backgroundColor: backgroundColor,
              height: 120,
            }}
            maxLength={2000}
          />
          <ThemedText style={{ 
            fontSize: 12, 
            color: mutedTextColor, 
            textAlign: 'right', 
            marginTop: 4 
          }}>
            {content.length}/2000
          </ThemedText>
        </View>

        {/* Tags Input */}
        <View style={{ marginBottom: 24 }}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
            Tags (optional)
          </ThemedText>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="tech, blockchain, discussion (comma separated)"
            placeholderTextColor={mutedTextColor}
            style={{
              borderWidth: 1,
              borderColor: borderColor,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: textColor,
              backgroundColor: backgroundColor,
            }}
          />
          <ThemedText style={{ 
            fontSize: 12, 
            color: mutedTextColor, 
            marginTop: 4 
          }}>
            Separate tags with commas. Example: tech, blockchain, discussion
          </ThemedText>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !title.trim() || !content.trim()}
          style={{
            backgroundColor: (!title.trim() || !content.trim() || isSubmitting) 
              ? mutedTextColor 
              : buttonColor,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <ThemedText style={{ 
            color: 'white', 
            fontWeight: '600',
            fontSize: 16 
          }}>
            {isSubmitting ? 'Creating Post...' : 'Create Post'}
          </ThemedText>
        </TouchableOpacity>

        {/* Help Text */}
        <ThemedText style={{ 
          fontSize: 12, 
          color: mutedTextColor, 
          textAlign: 'center',
          lineHeight: 16
        }}>
          Your post will be stored on the blockchain and visible to all bubble members.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}
