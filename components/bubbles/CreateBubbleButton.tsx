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
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={styles.createBubbleSection}>
      <TouchableOpacity
        style={[styles.createBubbleButton, { backgroundColor: tintColor }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.createBubbleButtonText, { color: '#fff' }]}>
            Create New Bubble
          </ThemedText>
          <ThemedText style={[styles.createBubbleSubtext, { color: 'rgba(255,255,255,0.8)' }]}>
            Start a community
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={14} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  createBubbleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createBubbleSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  createBubbleDescription: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    opacity: 0.7,
  },
});
