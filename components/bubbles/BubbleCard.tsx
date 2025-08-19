import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BubbleMetadata } from '@/types/bubble';
import { useVerification } from '@/hooks/useVerification';

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

  const { checkUserVerification, isVerificationSupported } = useVerification();
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const hasCheckedRef = useRef(false);

    // Helper function to get category icon based on bubble name/description
  const getCategoryIcon = () => {
    const name = bubble.name.toLowerCase();
    const description = bubble.description?.toLowerCase() || '';
    
    if (name.includes('tech') || name.includes('dev') || description.includes('development')) {
      return 'laptopcomputer';
    }
    if (name.includes('music') || description.includes('music')) {
      return 'music.note';
    }
    if (name.includes('sport') || name.includes('fitness') || description.includes('sport')) {
      return 'figure.run';
    }
    if (name.includes('food') || description.includes('food') || description.includes('cooking')) {
      return 'fork.knife';
    }
    if (name.includes('travel') || description.includes('travel')) {
      return 'airplane';
    }
    if (name.includes('art') || description.includes('art') || description.includes('creative')) {
      return 'paintbrush';
    }
    if (name.includes('finance') || name.includes('crypto') || description.includes('finance')) {
      return 'dollarsign.circle';
    }
    if (name.includes('health') || description.includes('health')) {
      return 'heart';
    }
    if (name.includes('education') || description.includes('learn')) {
      return 'book';
    }
    if (name.includes('game') || description.includes('game')) {
      return 'gamecontroller';
    }
    // Default icon
    return 'circle.badge.questionmark';
  };

  // Helper function to get trending icon based on post count
  const getTrendingStatus = () => {
    const postCount = bubble.postCount || 0;
    if (postCount > 100) return { icon: 'flame' as const, color: '#FF4500' };
    if (postCount > 50) return { icon: 'arrow.up.circle' as const, color: '#FF9800' };
    if (postCount > 10) return { icon: 'circle.dotted' as const, color: '#4CAF50' };
    return null;
  };
  useEffect(() => {
    const checkVerification = async () => {
      // Only check once and only if verification is required
      if (hasCheckedRef.current || 
          !bubble.verification?.providers || 
          bubble.verification.providers.length === 0) {
        return;
      }

      // Check if verification is supported
      if (!isVerificationSupported()) {
        return;
      }

      hasCheckedRef.current = true;
      setCheckingVerification(true);
      
      try {
        const verified = await checkUserVerification(bubble.id);
        setIsUserVerified(verified);
      } catch (error) {
        console.error('Error checking verification:', error);
        setIsUserVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    // Add a small delay to ensure clients are available
    const timeoutId = setTimeout(checkVerification, 100);
    return () => clearTimeout(timeoutId);
  }, [bubble.id]); // Only depend on bubble.id

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
              <IconSymbol 
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
                <IconSymbol 
                  name={getTrendingStatus()!.icon} 
                  size={16} 
                  color={getTrendingStatus()!.color}
                />
              </View>
            )}
            
            {/* Verification Status Badges */}
            <View style={styles.badgeContainer}>
              {verificationInfo.hasVerificationRequired && (
                <View style={styles.verificationBadgeContainer}>
                  {/* Verification Required Badge */}
                  <View style={[
                    styles.verificationBadge,
                    { 
                      backgroundColor: verificationInfo.isUserVerified ? '#4CAF50' : '#FF9800'
                    }
                  ]}>
                    <IconSymbol 
                      name={verificationInfo.checkingVerification ? "hourglass" : 
                            (verificationInfo.isUserVerified ? "checkmark.shield" : "shield")} 
                      size={12} 
                      color="#fff" 
                    />
                    <ThemedText style={styles.badgeText}>
                      {verificationInfo.checkingVerification ? 'Checking...' :
                       (verificationInfo.isUserVerified ? 'Verified' : 'Verification Required')}
                    </ThemedText>
                  </View>
                  
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
            <View style={styles.statItem}>
              <IconSymbol name="person.2.fill" size={14} color={tintColor} />
              <ThemedText style={[styles.statText, { color: tintColor }]}>
                {bubble.memberCount || 0} members
              </ThemedText>
            </View>

            {/* Post Count */}
            <View style={styles.statItem}>
              <IconSymbol name="bubble.left.fill" size={14} color={tintColor} />
              <ThemedText style={[styles.statText, { color: tintColor }]}>
                {bubble.postCount || 0} posts
              </ThemedText>
            </View>

            {/* Permission Icons */}
            <View style={styles.permissionIcons}>
              {/* Read Permission */}
              <View style={[styles.permissionIcon, { borderColor: tabIconDefault }]}>
                <IconSymbol 
                  name={bubble.permissions.read === 'public' ? "eye" : "eye.slash"} 
                  size={12} 
                  color={bubble.permissions.read === 'public' ? '#4CAF50' : '#FF9800'} 
                />
              </View>
              
              {/* Write Permission */}
              <View style={[styles.permissionIcon, { borderColor: tabIconDefault }]}>
                <IconSymbol 
                  name={bubble.permissions.write === 'public' ? "pencil" : "lock"} 
                  size={12} 
                  color={bubble.permissions.write === 'public' ? '#4CAF50' : '#FF9800'} 
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
  verificationBadgeContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
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
