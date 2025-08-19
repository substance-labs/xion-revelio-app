import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BubbleMetadata } from '@/types/bubble';
import { useVerification } from '@/hooks/useVerification';
import { useAbstraxionAccount } from '@/lib/abstraxion';

interface BubbleCardProps {
  bubble: BubbleMetadata;
  onPress: () => void;
}

export function BubbleCard({ 
  bubble, 
  onPress
}: BubbleCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const tabIconDefault = useThemeColor({}, 'tabIconDefault');

  const { checkUserVerification, isVerificationSupported, startVerification, isReclaimAvailable, getVerificationStatusMessage } = useVerification();
  const { data: account, isConnected } = useAbstraxionAccount();
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const hasCheckedRef = useRef<string | null>(null);

    // Helper function to get category icon based on bubble name/description
  const getCategoryIcon = () => {
    const name = bubble.name.toLowerCase();
    const description = bubble.description?.toLowerCase() || '';
    
    if (name.includes('tech') || name.includes('dev') || description.includes('development')) {
      return 'computer';
    }
    if (name.includes('music') || description.includes('music')) {
      return 'music-note';
    }
    if (name.includes('sport') || name.includes('fitness') || description.includes('sport')) {
      return 'directions-run';
    }
    if (name.includes('food') || description.includes('food') || description.includes('cooking')) {
      return 'restaurant';
    }
    if (name.includes('travel') || description.includes('travel')) {
      return 'flight';
    }
    if (name.includes('art') || description.includes('art') || description.includes('creative')) {
      return 'brush';
    }
    if (name.includes('finance') || name.includes('crypto') || description.includes('finance')) {
      return 'attach-money';
    }
    if (name.includes('health') || description.includes('health')) {
      return 'favorite';
    }
    if (name.includes('education') || description.includes('learn')) {
      return 'school';
    }
    if (name.includes('game') || description.includes('game')) {
      return 'sports-esports';
    }
    // Default icon
    return 'help-outline';
  };

  // Helper function to get trending icon based on post count
  const getTrendingStatus = () => {
    const postCount = bubble.postCount || 0;
    if (postCount > 100) return { icon: 'local-fire-department' as const, color: '#FF4500' };
    if (postCount > 50) return { icon: 'trending-up' as const, color: '#FF9800' };
    if (postCount > 10) return { icon: 'fiber-new' as const, color: '#4CAF50' };
    return null;
  };
  useEffect(() => {
    const checkVerification = async () => {
      // Reset checking state if we need to re-check
      if (!isConnected || !account?.bech32Address) {
        setIsUserVerified(false);
        setCheckingVerification(false);
        hasCheckedRef.current = null;
        return;
      }

      // Only check if verification is required
      if (!bubble.verification?.providers || bubble.verification.providers.length === 0) {
        setIsUserVerified(false);
        setCheckingVerification(false);
        return;
      }

      // Check if verification is supported
      if (!isVerificationSupported()) {
        setIsUserVerified(false);
        setCheckingVerification(false);
        return;
      }

      // Prevent duplicate checks for the same bubble/account combination
      const checkKey = `${bubble.id}-${account.bech32Address}`;
      if (hasCheckedRef.current === checkKey) {
        return;
      }

      hasCheckedRef.current = checkKey;
      setCheckingVerification(true);
      
      try {
        console.log(`Checking verification for bubble ${bubble.id} and user ${account.bech32Address}`);
        const verified = await checkUserVerification(bubble.id);
        console.log(`Verification result for bubble ${bubble.id}:`, verified);
        setIsUserVerified(verified);
      } catch (error) {
        console.error('Error checking verification:', error);
        setIsUserVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    // Check for proof
    const timeoutId = setTimeout(checkVerification, 100);
    return () => clearTimeout(timeoutId);
  }, [bubble.id, isConnected, account?.bech32Address, checkUserVerification, isVerificationSupported]); // Re-run when connection status or account changes

  // Helper function to get verification requirement info
  const getVerificationInfo = () => {
    const hasVerificationRequired = bubble.verification?.providers && bubble.verification.providers.length > 0;
    const readRequiresVerification = bubble.permissions.read === 'verified';
    const writeRequiresVerification = bubble.permissions.write === 'verified';
    
    return {
      hasVerificationRequired,
      readRequiresVerification,
      writeRequiresVerification,
      isUserVerified,
      checkingVerification
    };
  };

  // Helper function to get provider icon color
  const getProviderColor = (providerName: string): string => {
    switch (providerName.toLowerCase()) {
      case 'github':
        return '#24292e';
      case 'gmail':
        return '#ea4335';
      case 'strava':
        return '#fc4c02';
      case 'linkedin':
        return '#0a66c2';
      case 'twitter':
        return '#1da1f2';
      default:
        return tintColor;
    }
  };

  // Helper function to get provider icon source
  const getProviderIconSource = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'github':
        return require('@/assets/images/github.svg');
      case 'gmail':
        return require('@/assets/images/google.svg');
      case 'strava':
        return require('@/assets/images/strava.svg');
      case 'linkedin':
        return require('@/assets/images/linkedin.svg');
      case 'twitter':
        return require('@/assets/images/x.svg');
      default:
        return null;
    }
  };

  const verificationInfo = getVerificationInfo();

  // Handle verification button press
  const handleVerifyPress = async (e: any) => {
    e.stopPropagation(); // Prevent bubble card press
    
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect your wallet first');
      return;
    }

    if (!isReclaimAvailable()) {
      Alert.alert('Verification Unavailable', getVerificationStatusMessage());
      return;
    }

    setIsVerifying(true);
    try {
      const result = await startVerification({
        bubbleId: bubble.id,
        walletAddress: account?.bech32Address || '',
        provider: bubble.verification?.providers?.[0]?.id || '6d3f6753-7ee6-49ee-a545-62f1b1822ae5'
      });
      
      if (result.success) {
        setIsUserVerified(true);
        Alert.alert('Success', 'Verification completed successfully!');
      } else {
        Alert.alert('Verification Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to complete verification');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.bubbleCard,
        {
          backgroundColor: cardColor,
          borderColor: borderColor
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.bubbleHeader}>
        <View style={styles.bubbleInfo}>
          <View style={styles.bubbleTitleRow}>
            {/* Category Icon */}
            <View style={styles.categoryIconContainer}>
              <MaterialIcons 
                name={getCategoryIcon()} 
                size={20} 
                color={tintColor}
              />
            </View>
            
            <View style={styles.titleTextContainer}>
              <ThemedText type="defaultSemiBold" style={styles.bubbleName} numberOfLines={2}>
                {bubble.name}
              </ThemedText>
            </View>

            {/* Trending Status */}
            {getTrendingStatus() && (
              <View style={styles.trendingContainer}>
                <MaterialIcons 
                  name={getTrendingStatus()!.icon} 
                  size={16} 
                  color={getTrendingStatus()!.color}
                />
              </View>
            )}
            
            {/* Verification Status */}
            <View style={styles.badgeContainer}>
              {verificationInfo.hasVerificationRequired && (
                <View style={styles.verificationIconContainer}>
                  {verificationInfo.isUserVerified ? (
                    // Show green verified button when verified
                    <View style={[styles.verifyButton, { backgroundColor: '#4CAF50' }]}>
                      <MaterialIcons name="check" size={12} color="#fff" />
                      <ThemedText style={styles.verifyButtonText}>
                        Verified
                      </ThemedText>
                    </View>
                  ) : (
                    // Show verify button when not verified
                    <TouchableOpacity
                      style={[styles.verifyButton, { backgroundColor: tintColor }]}
                      onPress={handleVerifyPress}
                      disabled={isVerifying || checkingVerification}
                    >
                      {isVerifying || checkingVerification ? (
                        <MaterialIcons name="hourglass-empty" size={12} color="#fff" />
                      ) : (
                        <MaterialIcons name="verified-user" size={12} color="#fff" />
                      )}
                      <ThemedText style={styles.verifyButtonText}>
                        {isVerifying ? 'Verifying...' : checkingVerification ? 'Checking...' : 'Verify'}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  {/* Provider Icons */}
                  {bubble.verification?.providers && bubble.verification.providers.length > 0 && (
                    <View style={styles.providerIcons}>
                      {bubble.verification.providers.slice(0, 3).map((provider, index) => {
                        const iconSource = getProviderIconSource(provider.name);
                        return (
                          <View
                            key={provider.id}
                            style={[
                              styles.providerIcon,
                              { 
                                backgroundColor: iconSource ? '#fff' : getProviderColor(provider.name),
                                marginLeft: index > 0 ? -6 : 0,
                                zIndex: bubble.verification!.providers!.length - index
                              }
                            ]}
                          >
                            {iconSource ? (
                              <Image 
                                source={iconSource} 
                                style={styles.providerIconImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <ThemedText style={styles.providerIconText}>
                                {provider.name.charAt(0).toUpperCase()}
                              </ThemedText>
                            )}
                          </View>
                        );
                      })}
                      {bubble.verification.providers.length > 3 && (
                        <View style={[styles.providerIcon, styles.moreProvidersIcon, { backgroundColor: tabIconDefault }]}>
                          <ThemedText style={styles.providerIconText}>
                            +{bubble.verification.providers.length - 3}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          <ThemedText style={[styles.bubbleDescription, { color: textColor }]}>
            {bubble.description}
          </ThemedText>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {/* Member Count */}
            <View style={styles.counterIcons}>
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={14} color={tintColor} />
                <ThemedText style={[styles.statText, { color: tintColor }]}>
                  {bubble.memberCount || 0}
                </ThemedText>
              </View>

              {/* Post Count */}
              <View style={styles.statItem}>
                <MaterialIcons name="chat-bubble" size={14} color={tintColor} />
                <ThemedText style={[styles.statText, { color: tintColor }]}>
                  {bubble.postCount || 0}
                </ThemedText>
              </View>
            </View>


            {/* Permission Icons */}
            <View style={styles.permissionIcons}>
              {/* Read Permission */}
              <View style={[styles.permissionIcon, { borderColor: tabIconDefault }]}>
                <MaterialIcons 
                  name={
                    bubble.permissions.read === 'public' 
                      ? "visibility" 
                      : bubble.permissions.read === 'verified' && verificationInfo.isUserVerified
                        ? "visibility"
                        : "visibility-off"
                  } 
                  size={12} 
                  color={
                    bubble.permissions.read === 'public' || 
                    (bubble.permissions.read === 'verified' && verificationInfo.isUserVerified)
                      ? '#4CAF50' 
                      : '#FF9800'
                  } 
                />
              </View>
              
              {/* Write Permission */}
              <View style={[styles.permissionIcon, { borderColor: tabIconDefault }]}>
                <MaterialIcons 
                  name={
                    bubble.permissions.write === 'public' 
                      ? "edit" 
                      : bubble.permissions.write === 'verified' && verificationInfo.isUserVerified
                        ? "lock-open"
                        : "lock"
                  } 
                  size={12} 
                  color={
                    bubble.permissions.write === 'public' || 
                    (bubble.permissions.write === 'verified' && verificationInfo.isUserVerified)
                      ? '#4CAF50' 
                      : '#FF9800'
                  } 
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubbleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bubbleInfo: {
    flex: 1,
  },
  bubbleTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bubbleName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  bubbleDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  verificationIconContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  verificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifyButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  providerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreProvidersIcon: {
    marginLeft: -6,
  },
  providerIconText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  providerIconImage: {
    width: 14,
    height: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.8,
  },
  permissionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  permissionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  // Legacy styles (keeping for backwards compatibility)
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  memberCount: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.8,
  },
  // New icon styles
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(116, 140, 164, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  trendingContainer: {
    marginLeft: 8,
  },
});
