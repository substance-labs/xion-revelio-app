import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CreateBubbleFormData } from '@/types/bubble';
import { useVerification } from '@/hooks/useVerification';

interface CreateBubbleWizardProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (formData: CreateBubbleFormData) => Promise<boolean>;
}

export function CreateBubbleWizard({ visible, onClose, onCreate }: CreateBubbleWizardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const tabIconDefault = useThemeColor({}, 'tabIconDefault');

  const { getAvailableProviders, isVerificationSupported } = useVerification();

  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Helper function to get provider description
  const getProviderDescription = (providerName: string): string => {
    switch (providerName.toLowerCase()) {
      case 'github':
        return 'Verify with GitHub developer account';
      case 'gmail':
        return 'Verify with Google Gmail account';
      case 'strava':
        return 'Verify with Strava fitness account';
      case 'linkedin':
        return 'Verify with LinkedIn professional account';
      case 'twitter':
        return 'Verify with Twitter/X social account';
      default:
        return `Verify with ${providerName} account`;
    }
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
  const [formData, setFormData] = useState<CreateBubbleFormData>({
    name: '',
    description: '',
    permissions: {
      read: 'public',
      write: 'public'
    },
    verification: {
      provider: undefined
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: {
        read: 'public',
        write: 'public'
      },
      verification: {
        provider: undefined
      }
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const success = await onCreate(formData);
      if (success) {
        resetForm();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={handleClose}
          >
            <IconSymbol name="xmark" size={20} color={tintColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.modalTitle}>
            Create New Bubble
          </ThemedText>
          <View style={styles.modalCloseButton} />
        </View>

        <ScrollView 
          style={styles.modalContent} 
          contentContainerStyle={styles.modalContentContainer}
          onScroll={() => dropdownVisible && setDropdownVisible(false)}
          scrollEventThrottle={16}
        >
          {/* Basic Information */}
          <View style={styles.formSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Basic Information
            </ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Bubble Name *</ThemedText>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: cardColor, 
                  borderColor: borderColor,
                  color: textColor
                }]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="A title for this bubble..."
                placeholderTextColor={tabIconDefault}
              />
            </View>

            {/* Verification Provider Combobox */}
            {isVerificationSupported() && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Verification Provider</ThemedText>
                <View style={styles.comboboxContainer}>
                  <TouchableOpacity
                    style={[
                      styles.combobox,
                      dropdownVisible && styles.comboboxOpen,
                      { 
                        backgroundColor: cardColor, 
                        borderColor: dropdownVisible ? tintColor : borderColor 
                      }
                    ]}
                    onPress={() => setDropdownVisible(!dropdownVisible)}
                  >
                    <View style={styles.comboboxContent}>
                      <View style={styles.comboboxTextContainer}>
                        {formData.verification?.provider ? (
                          <>
                            <View style={[styles.providerIcon, { backgroundColor: getProviderColor(formData.verification.provider.name) }]}>
                              <ThemedText style={styles.providerIconText}>
                                {formData.verification.provider.name.charAt(0).toUpperCase()}
                              </ThemedText>
                            </View>
                            <ThemedText 
                              style={[styles.comboboxText, { color: textColor }]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {formData.verification.provider.name.charAt(0).toUpperCase() + formData.verification.provider.name.slice(1)}
                            </ThemedText>
                          </>
                        ) : (
                          <>
                            <View style={[styles.providerIcon, styles.providerIconEmpty, { borderColor: borderColor }]}>
                              <IconSymbol name="shield" size={12} color={tabIconDefault} />
                            </View>
                            <ThemedText 
                              style={[styles.comboboxPlaceholder, { color: tabIconDefault }]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              Select verification provider (optional)
                            </ThemedText>
                          </>
                        )}
                      </View>
                      <IconSymbol 
                        name={dropdownVisible ? "chevron.up" : "chevron.down"} 
                        size={16} 
                        color={dropdownVisible ? tintColor : tabIconDefault} 
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {dropdownVisible && (
                    <View style={[
                      styles.comboboxDropdown, 
                      { 
                        backgroundColor: cardColor, 
                        borderColor: borderColor,
                        shadowColor: textColor
                      }
                    ]}>
                      <TouchableOpacity
                        style={[
                          styles.comboboxOption,
                          getAvailableProviders().length === 0 && styles.comboboxOptionLast, // If no providers, this is the last item
                          !formData.verification?.provider && styles.comboboxOptionSelected,
                          !formData.verification?.provider && { backgroundColor: `${tintColor}15` }
                        ]}
                        onPress={() => {
                          setFormData(prev => ({
                            ...prev,
                            verification: {
                              ...prev.verification,
                              provider: undefined
                            }
                          }));
                          setDropdownVisible(false);
                        }}
                      >
                        <View style={styles.comboboxOptionContent}>
                          <View style={[styles.providerIcon, styles.providerIconEmpty, { borderColor: borderColor }]}>
                            <IconSymbol name="slash.circle" size={12} color={tabIconDefault} />
                          </View>
                          <View style={styles.comboboxOptionTextContainer}>
                            <ThemedText 
                              style={[
                                styles.comboboxOptionText,
                                { color: textColor },
                                !formData.verification?.provider && { color: tintColor, fontWeight: '600' }
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              No verification required
                            </ThemedText>
                            <ThemedText 
                              style={[styles.comboboxOptionSubtext, { color: tabIconDefault }]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              Public bubble accessible to everyone
                            </ThemedText>
                          </View>
                          {!formData.verification?.provider && (
                            <IconSymbol name="checkmark" size={16} color={tintColor} />
                          )}
                        </View>
                      </TouchableOpacity>

                      {getAvailableProviders().map((provider, index, array) => (
                        <TouchableOpacity
                          key={provider.id}
                          style={[
                            styles.comboboxOption,
                            index === array.length - 1 && styles.comboboxOptionLast, // Remove border from last item
                            formData.verification?.provider?.id === provider.id && styles.comboboxOptionSelected,
                            formData.verification?.provider?.id === provider.id && { backgroundColor: `${tintColor}15` }
                          ]}
                          onPress={() => {
                            setFormData(prev => ({
                              ...prev,
                              verification: {
                                ...prev.verification,
                                provider: provider
                              }
                            }));
                            setDropdownVisible(false);
                          }}
                        >
                          <View style={styles.comboboxOptionContent}>
                            <View style={[styles.providerIcon, { backgroundColor: getProviderColor(provider.name) }]}>
                              <ThemedText style={styles.providerIconText}>
                                {provider.name.charAt(0).toUpperCase()}
                              </ThemedText>
                            </View>
                            <View style={styles.comboboxOptionTextContainer}>
                              <ThemedText 
                                style={[
                                  styles.comboboxOptionText,
                                  { color: textColor },
                                  formData.verification?.provider?.id === provider.id && { color: tintColor, fontWeight: '600' }
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}
                              </ThemedText>
                              <ThemedText 
                                style={[styles.comboboxOptionSubtext, { color: tabIconDefault }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {getProviderDescription(provider.name)}
                              </ThemedText>
                            </View>
                            {formData.verification?.provider?.id === provider.id && (
                              <IconSymbol name="checkmark" size={16} color={tintColor} />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: cardColor, 
                  borderColor: borderColor,
                  color: textColor
                }]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe your bubble community..."
                placeholderTextColor={tabIconDefault}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Permissions */}
          <View style={styles.formSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Permissions
            </ThemedText>

            <View style={styles.permissionGroup}>
              <ThemedText style={styles.permissionLabel}>Who can read posts?</ThemedText>
              <View style={styles.permissionOptions}>
                {(['public', 'verified'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.permissionOption,
                      formData.permissions.read === option && { backgroundColor: tintColor },
                      { borderColor: borderColor }
                    ]}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, read: option }
                    }))}
                  >
                    <ThemedText style={[
                      styles.permissionOptionText,
                      formData.permissions.read === option && { color: '#fff' }
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.permissionGroup}>
              <ThemedText style={styles.permissionLabel}>Who can write posts?</ThemedText>
              <View style={styles.permissionOptions}>
                {(['public', 'verified'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.permissionOption,
                      formData.permissions.write === option && { backgroundColor: tintColor },
                      { borderColor: borderColor }
                    ]}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, write: option }
                    }))}
                  >
                    <ThemedText style={[
                      styles.permissionOptionText,
                      formData.permissions.write === option && { color: '#fff' }
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Create and Cancel Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: borderColor }]}
              onPress={handleClose}
            >
              <ThemedText style={[styles.cancelButtonText, { color: tintColor }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.createButton,
                loading && styles.disabledButton,
                { backgroundColor: tintColor }
              ]}
              onPress={handleCreate}
              disabled={loading}
            >
              <ThemedText style={[styles.createButtonText, { color: '#fff' }]}>
                {loading ? "Creating..." : "Create Bubble"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  permissionGroup: {
    marginBottom: 20,
  },
  permissionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  permissionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  permissionOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Legacy dropdown styles (keeping for backwards compatibility)
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // New Combobox styles
  comboboxContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  combobox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  comboboxOpen: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomWidth: 0,
  },
  comboboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  comboboxTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Important for text truncation
  },
  comboboxText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  comboboxPlaceholder: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  providerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIconEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  providerIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  comboboxDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 420,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
    paddingBottom: 4, // Add bottom padding to prevent text cutoff
  },
  comboboxOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  comboboxOptionLast: {
    borderBottomWidth: 0, // Remove border from last option
    paddingBottom: 16, // Extra padding for last option to prevent text cutoff
  },
  comboboxOptionSelected: {
    // Selected styling handled via backgroundColor prop
  },
  comboboxOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comboboxOptionTextContainer: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0, // Important for text truncation
  },
  comboboxOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  comboboxOptionSubtext: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 16,
    marginTop: 2,
  },
  comboboxBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});
