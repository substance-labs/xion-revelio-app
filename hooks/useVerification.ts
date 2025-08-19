import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAbstraxionSigningClient, useAbstraxionAccount, useAbstraxionClient } from '@/lib/abstraxion';
import { createPlatformVerificationService } from '@/services/verificationService';
import { VerificationRequest, VerificationResult, BubbleVerification, VerificationProvider } from '@/types/bubble';

export function useVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { client: signingClient } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();
  const { data: account } = useAbstraxionAccount();
  
  const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS || '';
  const collectionName = 'bubbles'; // Explicitly set collection name

  // Create verification service instance with useMemo to prevent recreation on every render
  const verificationService = useMemo(() => {
    return createPlatformVerificationService({
      client: queryClient || signingClient, // Prefer queryClient for general operations
      signingClient, // Add signingClient for transactions
      account: account || null,
      contractAddress,
      collectionName
    });
  }, [queryClient, signingClient, account, contractAddress, collectionName]);

  /**
   * Start verification process for a bubble
   */
  const startVerification = useCallback(async (request: VerificationRequest): Promise<VerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verificationService.startVerification(request);
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [verificationService]);

  /**
   * Check if current user is verified for a bubble
   */
    const checkUserVerification = useCallback(async (bubbleId: string) => {
    if (!account?.bech32Address) {
      console.log(`[useVerification] No account address available for verification check`);
      return false;
    }

    // Check if client is available before proceeding
    if (!queryClient && !signingClient) {
      console.log(`[useVerification] No client available for verification check`);
      return false;
    }

    // Check if verification service is ready
    if (!verificationService.isReady()) {
      console.log(`[useVerification] Verification service not ready`);
      return false;
    }
    
    console.log(`[useVerification] Checking verification for bubble ${bubbleId} and account ${account.bech32Address}`);
    const result = await verificationService.isUserVerified(bubbleId, account.bech32Address);
    console.log(`[useVerification] Verification result:`, result);
    return result;
  }, [account?.bech32Address, queryClient, signingClient, verificationService]);

  /**
   * Get user's verification details for a bubble
   */
  const getUserVerification = useCallback(async (bubbleId: string): Promise<BubbleVerification | null> => {
    if (!account?.bech32Address) return null;

    try {
      return await verificationService.getUserVerification(bubbleId, account.bech32Address);
    } catch (err) {
      console.error('Error getting user verification:', err);
      return null;
    }
  }, [verificationService, account]);

  /**
   * Check if user has access to read/write a bubble
   */
  const checkAccess = useCallback(async (bubbleId: string, action: 'read' | 'write'): Promise<boolean> => {
    try {
      // Pass empty string if no account, verification service will handle public access
      const walletAddress = account?.bech32Address || '';
      return await verificationService.checkAccess(bubbleId, walletAddress, action);
    } catch (err) {
      console.error('Error checking access:', err);
      return false;
    }
  }, [verificationService, account]);

  /**
   * Get all verified users for a bubble
   */
  const getVerifiedUsers = useCallback(async (bubbleId: string): Promise<BubbleVerification[]> => {
    try {
      return await verificationService.getVerifiedUsers(bubbleId);
    } catch (err) {
      console.error('Error getting verified users:', err);
      return [];
    }
  }, [verificationService]);

  /**
   * Remove verification for a user (admin only)
   */
  const removeVerification = useCallback(async (bubbleId: string, walletAddress: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await verificationService.removeVerification(bubbleId, walletAddress);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove verification';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [verificationService]);

  /**
   * Check if Reclaim verification is available
   */
  const isReclaimAvailable = useCallback((): boolean => {
    return verificationService.isReclaimAvailable();
  }, [verificationService]);

  /**
   * Get available verification providers
   */
  const getAvailableProviders = useCallback((): VerificationProvider[] => {
    console.log(verificationService.getAvailableProviders())
    return verificationService.getAvailableProviders();
  }, [verificationService]);

  /**
   * Check if verification is supported on current platform
   */
  const isVerificationSupported = useCallback((): boolean => {
    return verificationService.isVerificationSupported();
  }, [verificationService]);

  /**
   * Get verification status message
   */
  const getVerificationStatusMessage = useCallback((): string => {
    return verificationService.getVerificationStatusMessage();
  }, [verificationService]);

  return {
    // State
    isLoading,
    error,

    // Actions
    startVerification,
    checkUserVerification,
    getUserVerification,
    checkAccess,
    getVerifiedUsers,
    removeVerification,

    // Utilities
    isReclaimAvailable,
    getAvailableProviders,
    isVerificationSupported,
    getVerificationStatusMessage,

    // Clear error
    clearError: () => setError(null)
  };
}
