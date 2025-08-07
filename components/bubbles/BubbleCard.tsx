import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BubbleMetadata } from '@/types/bubble';

interface BubbleCardProps {
  bubble: BubbleMetadata;
  isUserVerified: boolean;
  verifyingBubble: string | null;
  onVerify: (bubbleId: string) => void;
  onEnter: (bubble: BubbleMetadata) => void;
}

export function BubbleCard({ 
  bubble, 
  isUserVerified, 
  verifyingBubble, 
  onVerify, 
  onEnter 
}: BubbleCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const buttonColor = useThemeColor({}, 'button');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');

  const canWrite = bubble.permissions.write === 'public' || 
                  (bubble.permissions.write === 'verified' && isUserVerified);

  return (
    <View
      style={[
        styles.bubbleCard,
        {
          backgroundColor: cardColor,
          borderColor: borderColor
        }
      ]}
    >
      <View style={styles.bubbleHeader}>
        <View style={styles.bubbleInfo}>
          <View style={styles.bubbleTitleRow}>
            <ThemedText type="subtitle" style={styles.bubbleName}>
              {bubble.name}
            </ThemedText>
            {bubble.verified && (
              <IconSymbol 
                name="checkmark.seal.fill" 
                size={20} 
                color={tintColor} 
                style={styles.verifiedIcon}
              />
            )}
          </View>
          <ThemedText style={styles.bubbleDescription}>
            {bubble.description}
          </ThemedText>
          
          {/* User verification status */}
          <View style={styles.userStatusRow}>
            {isUserVerified ? (
              <View style={styles.verifiedStatus}>
                <IconSymbol name="checkmark.circle.fill" size={16} color="#4CAF50" />
                <ThemedText style={[styles.statusText, { color: '#4CAF50' }]}>
                  Verified Member
                </ThemedText>
              </View>
            ) : (
              <View style={styles.unverifiedStatus}>
                <IconSymbol name="exclamationmark.circle" size={16} color={errorColor} />
                <ThemedText style={[styles.statusText, { color: errorColor }]}>
                  Not verified
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.buttonRow}>
        {!isUserVerified && (
          <TouchableOpacity
            style={[
              styles.verifyButton,
              verifyingBubble === bubble.id && styles.disabledButton,
              { backgroundColor: tintColor }
            ]}
            onPress={() => onVerify(bubble.id)}
            disabled={verifyingBubble === bubble.id}
          >
            <ThemedText style={[styles.verifyButtonText, { color: '#fff' }]}>
              {verifyingBubble === bubble.id ? "Verifying..." : "Get Verified"}
            </ThemedText>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.enterButton,
            !isUserVerified && styles.enterButtonSecondary,
            { backgroundColor: isUserVerified ? buttonColor : cardColor }
          ]}
          onPress={() => onEnter(bubble)}
        >
          <ThemedText style={[
            styles.enterButtonText, 
            { color: isUserVerified ? buttonTextColor : tintColor }
          ]}>
            Enter
          </ThemedText>
          <IconSymbol 
            name="arrow.right" 
            size={16} 
            color={isUserVerified ? buttonTextColor : tintColor} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  bubbleHeader: {
    marginBottom: 15,
  },
  bubbleInfo: {
    flex: 1,
  },
  bubbleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bubbleName: {
    fontSize: 18,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  bubbleDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 10,
  },
  userStatusRow: {
    marginTop: 5,
  },
  verifiedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  unverifiedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  verifyButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  enterButtonSecondary: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  enterButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
