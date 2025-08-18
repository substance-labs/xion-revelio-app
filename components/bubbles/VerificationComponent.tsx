import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useVerification } from '@/hooks/useVerification';
import { BubbleMetadata } from '@/types/bubble';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface VerificationComponentProps {
  bubble: BubbleMetadata;
  onVerificationComplete?: () => void;
}

export function VerificationComponent({ bubble, onVerificationComplete }: VerificationComponentProps) {
  const {
    startVerification,
    checkUserVerification,
    isLoading,
    error,
    getAvailableProviders,
    isVerificationSupported,
    getVerificationStatusMessage,
    clearError
  } = useVerification();

  const [isVerified, setIsVerified] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    // Check if user is already verified
    checkUserVerification(bubble.id).then(setIsVerified);
    
    // Get available providers
    setAvailableProviders(getAvailableProviders());
  }, [bubble.id, checkUserVerification, getAvailableProviders]);

  const handleVerification = async () => {
    if (!selectedProvider) {
      Alert.alert('Error', 'Please select a verification provider');
      return;
    }

    clearError();

    try {
      const result = await startVerification({
        bubbleId: bubble.id,
        provider: selectedProvider,
        walletAddress: '' // This will be filled by the service
      });

      if (result.success) {
        setIsVerified(true);
        Alert.alert('Success', 'Verification completed successfully!');
        onVerificationComplete?.();
      } else {
        Alert.alert('Verification Failed', result.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Verification error:', err);
      Alert.alert('Error', 'Failed to complete verification');
    }
  };

  // Don't show component if verification is not required
  if (!bubble.verification?.required) {
    return null;
  }

  // Don't show if already verified
  if (isVerified) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.verifiedText}>✅ Verified</ThemedText>
        <ThemedText style={styles.description}>
          You are verified and can access this bubble
        </ThemedText>
      </ThemedView>
    );
  }

  // Show verification not supported message
  if (!isVerificationSupported()) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Verification Required</ThemedText>
        <ThemedText style={styles.warningText}>
          {getVerificationStatusMessage()}
        </ThemedText>
        {Platform.OS === 'web' && (
          <ThemedText style={styles.description}>
            Please use the mobile app to complete verification for this bubble.
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Verification Required</ThemedText>
      <ThemedText style={styles.description}>
        This bubble requires verification to access. Please verify your identity using one of the available providers.
      </ThemedText>

      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}

      <View style={styles.providersContainer}>
        <ThemedText style={styles.providersTitle}>Select Verification Provider:</ThemedText>
        {availableProviders.map((provider) => (
          <TouchableOpacity
            key={provider}
            style={[
              styles.providerButton,
              selectedProvider === provider && styles.selectedProviderButton
            ]}
            onPress={() => setSelectedProvider(provider)}
            disabled={isLoading}
          >
            <Text style={[
              styles.providerButtonText,
              selectedProvider === provider && styles.selectedProviderButtonText
            ]}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, (!selectedProvider || isLoading) && styles.disabledButton]}
        onPress={handleVerification}
        disabled={!selectedProvider || isLoading}
      >
        <Text style={styles.verifyButtonText}>
          {isLoading ? 'Verifying...' : 'Start Verification'}
        </Text>
      </TouchableOpacity>

      <ThemedText style={styles.infoText}>
        Verification uses zero-knowledge proofs to confirm your identity without exposing personal data.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  providersContainer: {
    marginBottom: 16,
  },
  providersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  providerButton: {
    padding: 12,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  selectedProviderButton: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  providerButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  selectedProviderButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  verifyButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
