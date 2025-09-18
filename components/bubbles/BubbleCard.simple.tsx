import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BubbleMetadata } from '@/types/bubble';

interface BubbleCardProps {
  bubble: BubbleMetadata;
  onPress: () => void;
}

export function BubbleCard({ 
  bubble, 
  onPress
}: BubbleCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity
      style={[
        styles.bubbleCard,
        {
          backgroundColor: cardColor,
          borderColor: borderColor
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.bubbleHeader}>
        <View style={styles.bubbleInfo}>
                    <View style={styles.bubbleTitleRow}>
            <ThemedText type="defaultSemiBold" style={styles.bubbleName} numberOfLines={2}>
              {bubble.name}
            </ThemedText>
          </View>
          <ThemedText style={styles.bubbleDescription}>
            {bubble.description}
          </ThemedText>

          <View style={styles.memberCountRow}>
            <MaterialIcons name="people" size={14} color={tintColor} />
            <ThemedText style={[styles.memberCount, { color: tintColor }]}>
              {bubble.memberCount} members
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubbleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bubbleInfo: {
    flex: 1,
  },
  bubbleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bubbleName: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  bubbleDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  memberCount: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.8,
  },
});
