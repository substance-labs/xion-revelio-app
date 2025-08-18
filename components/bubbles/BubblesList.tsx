import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BubbleCard } from './BubbleCard';
import { BubbleMetadata } from '@/types/bubble';

interface BubblesListProps {
  bubbles: BubbleMetadata[];
  onBubblePress: (bubble: BubbleMetadata) => void;
}

export function BubblesList({ 
  bubbles, 
  onBubblePress
}: BubblesListProps) {
  return (
    <View style={styles.container}>
      {bubbles.map((bubble) => {
        return (
          <BubbleCard
            key={bubble.id}
            bubble={bubble}
            onPress={() => onBubblePress(bubble)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 15,
  },
});
