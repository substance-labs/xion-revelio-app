import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useBubbles } from '@/hooks/useBubbles';

interface CleanupButtonProps {
  onCleanupComplete?: () => void;
}

export function CleanupButton({ onCleanupComplete }: CleanupButtonProps) {
  const { cleanupTestBubbles } = useBubbles();
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleCleanup = async () => {
    Alert.alert(
      'Cleanup Test Bubbles',
      'This will delete your test bubbles (test3, test4, Twitter users) to make room for new ones. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsCleaningUp(true);
            try {
              const result = await cleanupTestBubbles();
              
              Alert.alert(
                'Cleanup Complete',
                `Successfully deleted ${result.deleted.length} bubbles.\n${result.failed.length > 0 ? `Failed to delete ${result.failed.length} bubbles.` : ''}`,
                [{ text: 'OK' }]
              );
              
              onCleanupComplete?.();
            } catch (error) {
              Alert.alert(
                'Cleanup Failed',
                error instanceof Error ? error.message : 'Unknown error occurred',
                [{ text: 'OK' }]
              );
            } finally {
              setIsCleaningUp(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={{ padding: 16, margin: 16, borderRadius: 8, backgroundColor: '#fff3cd' }}>
      <ThemedText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
        🧹 Cleanup Test Bubbles
      </ThemedText>
      <ThemedText style={{ marginBottom: 12, color: '#856404' }}>
        Remove test bubbles to make room for new ones in the 30-document limit.
      </ThemedText>
      <ThemedText 
        style={{ 
          color: isCleaningUp ? '#6c757d' : '#dc3545', 
          fontWeight: 'bold',
          textAlign: 'center',
          padding: 12,
          backgroundColor: isCleaningUp ? '#f8f9fa' : '#f8d7da',
          borderRadius: 4,
        }}
        onPress={isCleaningUp ? undefined : handleCleanup}
      >
        {isCleaningUp ? 'Cleaning up...' : 'Delete Test Bubbles'}
      </ThemedText>
    </ThemedView>
  );
}
