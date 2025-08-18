import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { CreateBubbleFormData } from '@/types/bubble';
import { useVerification } from '@/hooks/useVerification';

interface CreateBubbleWizardProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (formData: CreateBubbleFormData) => Promise<boolean>;
  loading: boolean;
}

export function CreateBubbleWizard({ visible, onClose, onCreate, loading }: CreateBubbleWizardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const tabIconDefault = useThemeColor({}, 'tabIconDefault');

  const { getAvailableProviders, isVerificationSupported } = useVerification();

  const [formData, setFormData] = useState<CreateBubbleFormData>({
    name: '',
    description: '',
    domain: '',
    permissions: {
      read: 'public',
      write: 'public'
    },
    verification: {
      required: false,
      providers: []
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      domain: '',
      permissions: {
        read: 'public',
        write: 'public'
      },
      verification: {
        required: false,
        providers: []
      }
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const success = await onCreate(formData);
    if (success) {
      resetForm();
      onClose();
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

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
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
                placeholder="e.g., @company.com"
                placeholderTextColor={tabIconDefault}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Domain *</ThemedText>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: cardColor, 
                  borderColor: borderColor,
                  color: textColor
                }]}
                value={formData.domain}
                onChangeText={(text) => setFormData(prev => ({ ...prev, domain: text }))}
                placeholder="company.com"
                placeholderTextColor={tabIconDefault}
                autoCapitalize="none"
              />
            </View>

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
                {(['public', 'admins', 'verified'] as const).map((option) => (
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

          {/* Verification Settings */}
          {isVerificationSupported() && (
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Verification Settings
              </ThemedText>

              <View style={styles.switchGroup}>
                <View style={styles.switchLabelContainer}>
                  <ThemedText style={styles.switchLabel}>Require Verification</ThemedText>
                  <ThemedText style={styles.switchDescription}>
                    Users must verify their identity to access this bubble
                  </ThemedText>
                </View>
                <Switch
                  value={formData.verification?.required || false}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    verification: {
                      required: value,
                      providers: value ? getAvailableProviders() : []
                    }
                  }))}
                  trackColor={{ false: '#e0e0e0', true: tintColor }}
                  thumbColor={'#fff'}
                />
              </View>

              {formData.verification?.required && (
                <View style={styles.providersGroup}>
                  <ThemedText style={styles.permissionLabel}>Available Verification Providers</ThemedText>
                  <View style={styles.permissionOptions}>
                    {getAvailableProviders().map((provider) => (
                      <TouchableOpacity
                        key={provider}
                        style={[
                          styles.permissionOption,
                          formData.verification?.providers.includes(provider) && { backgroundColor: tintColor },
                          { borderColor: borderColor }
                        ]}
                        onPress={() => setFormData(prev => {
                          const currentProviders = prev.verification?.providers || [];
                          const newProviders = currentProviders.includes(provider)
                            ? currentProviders.filter(p => p !== provider)
                            : [...currentProviders, provider];
                          
                          return {
                            ...prev,
                            verification: {
                              ...prev.verification,
                              required: prev.verification?.required || false,
                              providers: newProviders
                            }
                          };
                        })}
                      >
                        <ThemedText style={[
                          styles.permissionOptionText,
                          formData.verification?.providers.includes(provider) && { color: '#fff' }
                        ]}>
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

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
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  providersGroup: {
    marginTop: 15,
  },
});
