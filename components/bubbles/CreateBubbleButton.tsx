import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

interface CreateBubbleButtonProps {
  onPress: () => void;
}

export function CreateBubbleButton({ onPress }: CreateBubbleButtonProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.createBubbleSection}>
      <TouchableOpacity
        style={[styles.createBubbleButton, { backgroundColor: tintColor }]}
        onPress={onPress}
      >
        <IconSymbol name="plus.circle.fill" size={16} color="#fff" />
        <ThemedText style={[styles.createBubbleButtonText, { color: '#fff' }]}>
          Create Bubble
        </ThemedText>
      </TouchableOpacity>
      <ThemedText style={styles.createBubbleDescription}>
        Start your own community chat space
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  createBubbleSection: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  createBubbleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  createBubbleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createBubbleDescription: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
});
