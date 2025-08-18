import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { useBubbles } from '@/hooks/useBubbles';
import { BubblesList } from '@/components/bubbles/BubblesList';
import { CreateBubbleWizard } from '@/components/bubbles/CreateBubbleWizard';
import { CreateBubbleButton } from '@/components/bubbles/CreateBubbleButton';
import { useAbstraxionAccount } from '@/lib/abstraxion';
import { CreateBubbleFormData } from '@/types/bubble';

if (!process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS) {
  throw new Error("EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS is not set in your environment file");
}

export default function Bubbles() {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'tint');
  const router = useRouter();
  
  const { 
    bubbles, 
    isLoading,
    error,
    refetch,
    createBubble
  } = useBubbles();

  const { data: account, isConnected, login } = useAbstraxionAccount();

  // State for components
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBubble = async (formData: CreateBubbleFormData): Promise<boolean> => {
    setIsCreating(true);
    try {
      await createBubble(formData);
      return true;
    } catch (error) {
      console.error('Error creating bubble:', error);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const enterBubble = (bubble: any) => {
    router.push({
      pathname: '/bubble/[id]',
      params: { id: bubble.id }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <ThemedText type="title" style={styles.title}>
          Bubbles
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Chat spaces for communities
        </ThemedText>

        {!isConnected ? (
          <TouchableOpacity 
            style={[styles.connectToCreateButton, { backgroundColor: accentColor }]}
            onPress={login || (() => console.log('Login not available'))}
          >
            <ThemedText style={styles.connectButtonText}>Connect Wallet to Create Bubble</ThemedText>
          </TouchableOpacity>
        ) : (
          <CreateBubbleButton
            onPress={() => setShowCreateWizard(true)}
          />
        )}
        
        <BubblesList 
          bubbles={bubbles}
          onBubblePress={enterBubble}
        />
      </ScrollView>

      <CreateBubbleWizard
        visible={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onCreate={handleCreateBubble}
        loading={isCreating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  connectPrompt: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    marginVertical: 20,
  },
  connectText: {
    marginBottom: 15,
    textAlign: 'center',
    opacity: 0.8,
  },
  connectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectToCreateButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
