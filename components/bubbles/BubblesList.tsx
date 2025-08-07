import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BubbleCard } from './BubbleCard';
import { BubbleMetadata } from '@/types/bubble';

interface BubblesListProps {
  bubbles: BubbleMetadata[];
  userVerifications: { [bubbleId: string]: boolean };
  verifyingBubble: string | null;
  onVerify: (bubbleId: string) => void;
  onEnter: (bubble: BubbleMetadata) => void;
}

export function BubblesList({ 
  bubbles, 
  userVerifications, 
  verifyingBubble, 
  onVerify, 
  onEnter 
}: BubblesListProps) {
  return (
    <View style={styles.container}>
      {bubbles.map((bubble) => {
        const isUserVerified = userVerifications[bubble.id] || false;

        return (
          <BubbleCard
            key={bubble.id}
            bubble={bubble}
            isUserVerified={isUserVerified}
            verifyingBubble={verifyingBubble}
            onVerify={onVerify}
            onEnter={onEnter}
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
