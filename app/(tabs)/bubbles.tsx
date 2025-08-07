import { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { useBubbles } from '@/hooks/useBubbles';
import { BubblesList } from '@/components/bubbles/BubblesList';
import { CreateBubbleWizard } from '@/components/bubbles/CreateBubbleWizard';
import { CreateBubbleButton } from '@/components/bubbles/CreateBubbleButton';
import { BubbleMetadata } from '@/types/bubble';

if (!process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS) {
  throw new Error("EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS is not set in your environment file");
}

export default function Bubbles() {
  const backgroundColor = useThemeColor({}, 'background');
  const router = useRouter();
  
  const {
    bubbles,
    userVerifications,
    refreshing,
    isConnected,
    account,
    client,
    queryClient,
    createBubble,
    verifyForBubble,
    onRefresh
  } = useBubbles();

  // State for components
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [verifyingBubble, setVerifyingBubble] = useState<string | null>(null);

  const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS as string;

  const handleCreateBubble = async (formData: any) => {
    setCreateLoading(true);
    const success = await createBubble(formData);
    setCreateLoading(false);
    return success;
  };

  const handleVerifyBubble = async (bubbleId: string) => {
    setVerifyingBubble(bubbleId);
    await verifyForBubble(bubbleId);
    setVerifyingBubble(null);
  };

  const enterBubble = (bubble: BubbleMetadata) => {
    router.push({
      pathname: '/bubble/[id]',
      params: { id: bubble.id, name: bubble.name }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedText type="title" style={styles.title}>
          Bubbles
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Verified member chat spaces for communities
        </ThemedText>

        {/* Create Bubble Button - only show when connected */}
        {isConnected && (
          <CreateBubbleButton
            onPress={() => setShowCreateWizard(true)}
            account={account}
            client={client}
            queryClient={queryClient}
            contractAddress={contractAddress}
            onRefresh={onRefresh}
          />
        )}

        {!isConnected ? (
          <View style={styles.connectPrompt}>
            <ThemedText style={styles.connectText}>
              Connect your wallet to join bubbles
            </ThemedText>
          </View>
        ) : (
          <BubblesList
            bubbles={bubbles}
            userVerifications={userVerifications}
            verifyingBubble={verifyingBubble}
            onVerify={handleVerifyBubble}
            onEnter={enterBubble}
          />
        )}
      </ScrollView>

      {/* Create Bubble Wizard Modal */}
      <CreateBubbleWizard
        visible={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onCreate={handleCreateBubble}
        loading={createLoading}
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
    paddingTop: 60,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 30,
  },
  connectPrompt: {
    alignItems: 'center',
    marginTop: 50,
  },
  connectText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
