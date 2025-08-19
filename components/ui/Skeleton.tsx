import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}: SkeletonProps) {
  const backgroundColor = useThemeColor({}, 'border');
  
  return (
    <View 
      style={[
        styles.skeleton,
        {
          backgroundColor,
          width,
          height,
          borderRadius,
        },
        style
      ]} 
    />
  );
}

interface SkeletonCardProps {
  style?: any;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  
  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor }, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={80} height={16} />
        <Skeleton width={60} height={12} />
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="70%" height={14} style={{ marginTop: 4 }} />
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={12} />
        <Skeleton width={80} height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    opacity: 0.3,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
});
