import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAbstraxionAccount, useAbstraxionClient, useAbstraxionSigningClient } from '@/lib/abstraxion';
import { BubbleMetadata, CreateBubbleFormData } from '@/types/bubble';
import { BubbleService, createBubbleService } from '@/services/bubbleService';

export function useBubbles() {
  const [bubbles, setBubbles] = useState<BubbleMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionClient(); // For read-only operations
  const { client: signingClient } = useAbstraxionSigningClient(); // For write operations

  // Create the bubble service instance for write operations (needs signing client and account)
  const bubbleService = useMemo(() => {
    if (!signingClient || !account) {
      return null;
    }

    const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error('DocuStore contract address not configured');
      return null;
    }

    return createBubbleService({
      client: signingClient, // Use signing client for write operations
      account,
      contractAddress,
      collectionName: process.env.EXPO_PUBLIC_BUBBLES_COLLECTION || 'bubbles', // Explicitly set collection name
    });
  }, [signingClient, account]);

  // Also create a read-only service that works without account for fetching bubbles
  const readOnlyBubbleService = useMemo(() => {
    if (!client) {
      return null;
    }

    const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error('DocuStore contract address not configured');
      return null;
    }

    return createBubbleService({
      client,
      account: null, // No account needed for reading
      contractAddress,
      collectionName: 'bubbles', // Explicitly set collection name
    });
  }, [client]); // Only depends on client, not account

  // Fetch all bubbles in the collection (for discovery)
  const fetchAllBubbles = useCallback(async () => {
    // Use read-only service to fetch bubbles without requiring authentication
    const serviceToUse = readOnlyBubbleService || bubbleService;
    
    if (!serviceToUse) {
      console.log('useBubbles (native): Cannot fetch bubbles - no service available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('useBubbles (native): Fetching all bubbles using BubbleService...');
      const fetchedBubbles = await serviceToUse.fetchAllBubbles();
      console.log('useBubbles (native): Fetched all bubbles count:', fetchedBubbles.length);
      setBubbles(fetchedBubbles);
    } catch (error) {
      console.error('useBubbles (native): Error fetching all bubbles:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [readOnlyBubbleService, bubbleService]);

  // Fetch user's own bubbles only
  const fetchUserBubbles = useCallback(async () => {
    if (!bubbleService) {
      console.log('Cannot fetch user bubbles - bubble service not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching user bubbles using BubbleService...');
      const fetchedBubbles = await bubbleService.fetchUserBubbles();
      setBubbles(fetchedBubbles);
    } catch (error) {
      console.error('Error fetching user bubbles:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [bubbleService]);

  // Default fetch function (fetch all bubbles for discovery)
  const fetchBubbles = fetchAllBubbles;

  // Create a new bubble
  const createBubble = useCallback(async (formData: CreateBubbleFormData): Promise<BubbleMetadata> => {
    if (!bubbleService) {
      throw new Error('Bubble service not available');
    }

    console.log('useBubbles (native): Starting bubble creation with data:', formData);
    console.log('useBubbles (native): Bubble service available:', !!bubbleService);
    console.log('useBubbles (native): Account available:', !!account);
    console.log('useBubbles (native): Signing client available:', !!signingClient);

    try {
      const newBubble = await bubbleService.createBubble(formData);
      console.log('useBubbles (native): Bubble created successfully:', newBubble);
      
      // Update local state to include the new bubble
      setBubbles(prevBubbles => {
        console.log('useBubbles (native): Adding bubble to local state. Previous count:', prevBubbles.length);
        const updated = [...prevBubbles, newBubble];
        console.log('useBubbles (native): New bubble count:', updated.length);
        return updated;
      });
      
      return newBubble;
    } catch (error) {
      console.error('useBubbles (native): Failed to create bubble:', error);
      throw error;
    }
  }, [bubbleService, account, signingClient]);

  // Cleanup test bubbles
  const cleanupTestBubbles = useCallback(async () => {
    console.log('=== CLEANUP DEBUG START ===');
    console.log('bubbleService available:', !!bubbleService);
    console.log('account in hook:', account);
    console.log('account address in hook:', account?.bech32Address);
    console.log('signingClient available:', !!signingClient);
    
    if (!bubbleService) {
      throw new Error('Bubble service not available');
    }

    console.log('useBubbles (native): Starting test bubble cleanup');
    
    try {
      const result = await bubbleService.cleanupTestBubbles();
      console.log('useBubbles (native): Cleanup completed:', result);
      
      // Refresh the bubble list after cleanup
      await fetchBubbles();
      
      return result;
    } catch (error) {
      console.error('useBubbles (native): Failed to cleanup test bubbles:', error);
      throw error;
    }
  }, [bubbleService, fetchBubbles, account, signingClient]);

  // Get a specific bubble by ID
  const getBubble = useCallback(async (bubbleId: string): Promise<BubbleMetadata | null> => {
    if (!bubbleService) {
      throw new Error('Bubble service not available');
    }

    return await bubbleService.getBubbleById(bubbleId);
  }, [bubbleService]);

  // Update an existing bubble
  const updateBubble = useCallback(async (bubbleId: string, updates: Partial<BubbleMetadata>): Promise<BubbleMetadata> => {
    if (!bubbleService) {
      throw new Error('Bubble service not available');
    }

    const updatedBubble = await bubbleService.updateBubble(bubbleId, updates);
    
    // Update local state
    setBubbles(prevBubbles => 
      prevBubbles.map(bubble => 
        bubble.id === bubbleId ? updatedBubble : bubble
      )
    );
    
    return updatedBubble;
  }, [bubbleService]);

  // Delete a bubble
  const deleteBubble = useCallback(async (bubbleId: string): Promise<void> => {
    if (!bubbleService) {
      throw new Error('Bubble service not available');
    }

    await bubbleService.deleteBubble(bubbleId);
    
    // Update local state to remove the deleted bubble
    setBubbles(prevBubbles => 
      prevBubbles.filter(bubble => bubble.id !== bubbleId)
    );
  }, [bubbleService]);

  // Initial fetch on mount and when client becomes available
  useEffect(() => {
    fetchBubbles();
  }, [client]); // Only fetch when client changes, not when fetchBubbles changes

  return {
    // Data
    bubbles,
    isLoading,
    error,
    
    // Actions
    refetch: fetchBubbles,
    fetchAllBubbles,
    fetchUserBubbles,
    createBubble,
    getBubble,
    updateBubble,
    deleteBubble,
    cleanupTestBubbles,
    
    // Service instance (for advanced use cases)
    bubbleService,
  };
}
