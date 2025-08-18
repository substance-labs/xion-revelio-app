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
    });
  }, [client]); // Only depends on client, not account

  // Fetch all bubbles in the collection (for discovery)
  const fetchAllBubbles = useCallback(async () => {
    // Use read-only service to fetch bubbles without requiring authentication
    const serviceToUse = readOnlyBubbleService || bubbleService;
    
    if (!serviceToUse) {
      console.log('Cannot fetch bubbles - no service available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching all bubbles using BubbleService...');
      const fetchedBubbles = await serviceToUse.fetchAllBubbles();
      setBubbles(fetchedBubbles);
    } catch (error) {
      console.error('Error fetching all bubbles:', error);
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

    const newBubble = await bubbleService.createBubble(formData);
    
    // Update local state to include the new bubble
    setBubbles(prevBubbles => [...prevBubbles, newBubble]);
    
    return newBubble;
  }, [bubbleService]);

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
    
    // Service instance (for advanced use cases)
    bubbleService,
  };
}
