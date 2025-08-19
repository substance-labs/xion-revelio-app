import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BubbleCard } from './BubbleCard';
import { BubbleMetadata } from '@/types/bubble';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

interface BubblesListProps {
  bubbles: BubbleMetadata[];
  onBubblePress: (bubble: BubbleMetadata) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function BubblesList({ 
  bubbles, 
  onBubblePress,
  isLoading = false,
  error = null
}: BubblesListProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  // Calculate stats
  const totalBubbles = bubbles.length;
  const verifiedBubbles = bubbles.filter(b => b.verification?.providers && b.verification.providers.length > 0).length;
  const totalPosts = bubbles.reduce((sum, b) => sum + (b.postCount || 0), 0);
  
  // Show loading skeletons
  if (isLoading && bubbles.length === 0) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          {error}
        </ThemedText>
      </View>
    );
  }

  // Show empty state
  if (!isLoading && bubbles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="bubble.right" size={48} color={tintColor} />
        <ThemedText style={styles.emptyText}>
          No bubbles found. Create your first bubble to get started!
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      {totalBubbles > 0 && (
        <View style={styles.statsHeader}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconSymbol name="bubble.middle.bottom" size={16} color={tintColor} />
              <ThemedText style={[styles.statText, { color: textColor }]}>
                {totalBubbles} {totalBubbles === 1 ? 'Bubble' : 'Bubbles'}
              </ThemedText>
            </View>
            
            {verifiedBubbles > 0 && (
              <View style={styles.statItem}>
                <IconSymbol name="checkmark.shield" size={16} color="#4CAF50" />
                <ThemedText style={[styles.statText, { color: textColor }]}>
                  {verifiedBubbles} Verified
                </ThemedText>
              </View>
            )}
            
            {totalPosts > 0 && (
              <View style={styles.statItem}>
                <IconSymbol name="text.bubble" size={16} color={tintColor} />
                <ThemedText style={[styles.statText, { color: textColor }]}>
                  {totalPosts} Posts
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      )}
      {bubbles.map((bubble) => {
        return (
          <BubbleCard
            key={bubble.id}
            bubble={bubble}
            onPress={() => onBubblePress(bubble)}
          />
        );
      })}
      
      {/* Show loading at bottom when loading more */}
      {isLoading && bubbles.length > 0 && (
        <LoadingSpinner size="small" text="Loading more bubbles..." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 15,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  statsHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
