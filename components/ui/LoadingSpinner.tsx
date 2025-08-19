import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  style?: any;
}

export function LoadingSpinner({ size = 'large', text, style }: LoadingSpinnerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={tintColor} />
      {text && (
        <ThemedText style={[styles.text, { color: textColor }]}>
          {text}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
