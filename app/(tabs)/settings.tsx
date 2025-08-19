import { useState, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Alert, ScrollView, Switch, AppState } from "react-native";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from "@/lib/abstraxion";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useBubbles } from "@/hooks/useBubbles";

const contractAddress = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS as string;

if (!contractAddress) {
  throw new Error("EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS is not set in your environment file");
}

interface Settings {
  darkMode: boolean;
  notifications: boolean;
}

export default function Settings() {
  // Abstraxion hooks
  const { data: account, login, logout, isConnected } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();
  
  // Bubbles hook for cleanup functionality
  const { cleanupTestBubbles } = useBubbles();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const buttonColor = useThemeColor({}, 'button');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const errorColor = useThemeColor({}, 'error');

  // State variables
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    darkMode: false,
    notifications: true,
  });

  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const themedStyles = useMemo(() => ({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    title: {
      marginBottom: 20,
      textAlign: 'center' as const,
    },
    mainContainer: {
      flex: 1,
      gap: 20,
    },
    section: {
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: borderColor,
    },
    settingRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    settingInfo: {
      flex: 1,
      marginRight: 15,
    },
    settingTitle: {
      marginBottom: 5,
    },
    settingDescription: {
      fontSize: 14,
      color: textColor,
    },
    menuButton: {
      padding: 15,
      borderRadius: 10,
      alignItems: 'center' as const,
      backgroundColor: buttonColor,
    },
    logoutButton: {
      backgroundColor: errorColor,
    },
    cleanupButton: {
      backgroundColor: '#ff9500', // Orange warning color
    },
    cleanupSection: {
      backgroundColor: '#fff3cd', // Light warning background
      borderColor: '#ffeaa7',
    },
    fullWidthButton: {
      width: '100%' as const,
    },
    buttonText: {
      color: buttonTextColor,
      fontSize: 16,
      fontWeight: '500' as const,
    },
    disabledButton: {
      opacity: 0.5,
    },
    connectButtonContainer: {
      width: '100%' as const,
      paddingHorizontal: 20,
      alignItems: 'center' as const,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    loadingText: {
      textAlign: 'center' as const,
      fontSize: 16,
      color: textColor,
    },
  }), [backgroundColor, borderColor, textColor, tintColor, buttonColor, buttonTextColor, errorColor]);

  // Fetch settings
  const fetchSettings = async () => {
    if (!queryClient) {
      console.log("Query client not initialized");
      setLoading(false);
      return;
    }
    
    if (!account?.bech32Address) {
      console.log("Account address not available");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log("Fetching settings for address:", account.bech32Address);
      console.log("Using contract address:", contractAddress);
      
      const response = await queryClient.queryContractSmart(
        contractAddress,
        {
          UserDocuments: {
            owner: account.bech32Address,
            collection: "settings"
          }
        }
      );
      
      console.log("Settings response:", response);
      
      if (response?.documents) {
        const settingsDoc = response.documents.find(([id]: [string, any]) => id === account.bech32Address);
        if (settingsDoc) {
          const settingsData = JSON.parse(settingsDoc[1].data);
          console.log("Found settings data:", settingsData);
          setSettings(settingsData);
        } else {
          console.log("No settings document found, initializing default settings");
          // Initialize with default settings if none exists
          const defaultSettings: Settings = {
            darkMode: false,
            notifications: true,
          };
          setSettings(defaultSettings);
        }
      } else {
        console.log("No documents in response, initializing default settings");
        // Initialize with default settings if none exists
        const defaultSettings: Settings = {
          darkMode: false,
          notifications: true,
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Initialize with default settings on error
      const defaultSettings: Settings = {
        darkMode: false,
        notifications: true,
      };
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  // Update settings
  const updateSettings = async (newSettings: Settings) => {
    if (!client || !account) return;
    
    setLoading(true);
    try {
      await client.execute(
        account.bech32Address,
        contractAddress,
        {
          Set: {
            collection: "settings",
            document: account.bech32Address,
            data: JSON.stringify(newSettings)
          }
        },
        "auto"
      );
      
      setSettings(newSettings);
      Alert.alert("Success", "Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      Alert.alert("Error", "Failed to update settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cleanup all user bubbles
  const handleCleanupTestBubbles = async () => {
    // Check if cleanup is available
    if (!cleanupTestBubbles) {
      Alert.alert(
        'Service Unavailable',
        'Bubble cleanup service is not available. Please ensure your wallet is connected and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cleanup All Bubbles',
      'This will delete ALL your bubbles to make room for new ones in the 30-document limit. This action cannot be undone. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setIsCleaningUp(true);
            try {
              console.log('Starting cleanup process...');
              console.log('Account:', account);
              console.log('Is connected:', isConnected);
              console.log('Signing client available:', !!client);
              console.log('Query client available:', !!queryClient);
              
              const result = await cleanupTestBubbles();
              
              Alert.alert(
                'Cleanup Complete',
                `Successfully deleted ${result.deleted.length} bubbles.\n${result.failed.length > 0 ? `Failed to delete ${result.failed.length} bubbles.` : 'This should make room for new bubbles to appear.'}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Cleanup error:', error);
              Alert.alert(
                'Cleanup Failed',
                error instanceof Error ? error.message : 'Unknown error occurred',
                [{ text: 'OK' }]
              );
            } finally {
              setIsCleaningUp(false);
            }
          },
        },
      ]
    );
  };

  // Effect to fetch settings when account changes
  useEffect(() => {
    console.log("Account changed, fetching settings");
    console.log("Account:", account);
    console.log("Is connected:", isConnected);
    console.log("Query client:", queryClient ? "available" : "not available");
    
    // Reset loading state if not connected
    if (!isConnected) {
      setLoading(false);
      return;
    }
    
    // Wait for both queryClient and account to be available
    if (queryClient && account?.bech32Address) {
      fetchSettings();
    } else {
      // Reset loading state if either is not available
      setLoading(false);
    }
  }, [account?.bech32Address, isConnected, queryClient]);

  // Add effect to handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isConnected && account?.bech32Address && queryClient) {
        console.log("App became active, refreshing settings");
        fetchSettings();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isConnected, account?.bech32Address, queryClient]);

  return (
    <ThemedView style={themedStyles.container}>
      <ScrollView 
        contentContainerStyle={themedStyles.contentContainer}
      >
        <ThemedText type="title" style={themedStyles.title}>Settings</ThemedText>

        {!isConnected ? (
          <View style={themedStyles.connectButtonContainer}>
            <TouchableOpacity
              onPress={async () => {
                if (!account?.bech32Address) {
                  setIsLoggingIn(true);
                  try {
                    await login();
                  } catch (error) {
                    console.error('Login failed:', error);
                  } finally {
                    setIsLoggingIn(false);
                  }
                }
              }}
              style={[themedStyles.menuButton, themedStyles.fullWidthButton, isLoggingIn && themedStyles.disabledButton]}
              disabled={isLoggingIn}
            >
              <ThemedText style={themedStyles.buttonText}>
                {isLoggingIn ? "Connecting..." : "Connect Wallet"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={themedStyles.loadingContainer}>
            <ThemedText style={themedStyles.loadingText}>Loading settings...</ThemedText>
          </View>
        ) : (
          <View style={themedStyles.mainContainer}>
            {/* Dark Mode */}
            <ThemedView style={themedStyles.section}>
              <View style={themedStyles.settingRow}>
                <View style={themedStyles.settingInfo}>
                  <ThemedText type="defaultSemiBold" style={themedStyles.settingTitle}>Dark Mode</ThemedText>
                  <ThemedText style={themedStyles.settingDescription}>
                    Enable dark mode for better visibility in low-light conditions
                  </ThemedText>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  disabled={loading}
                  trackColor={{ false: borderColor, true: tintColor }}
                  thumbColor={isDarkMode ? buttonColor : backgroundColor}
                />
              </View>
            </ThemedView>

            {/* Notifications */}
            <ThemedView style={themedStyles.section}>
              <View style={themedStyles.settingRow}>
                <View style={themedStyles.settingInfo}>
                  <ThemedText type="defaultSemiBold" style={themedStyles.settingTitle}>Notifications</ThemedText>
                  <ThemedText style={themedStyles.settingDescription}>
                    Receive notifications for important updates
                  </ThemedText>
                </View>
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => updateSettings({ ...settings, notifications: value })}
                  disabled={loading}
                  trackColor={{ false: borderColor, true: tintColor }}
                  thumbColor={settings.notifications ? buttonColor : backgroundColor}
                />
              </View>
            </ThemedView>

            {/* Cleanup All Bubbles */}
            <ThemedView style={[themedStyles.section, themedStyles.cleanupSection]}>
              <ThemedText type="defaultSemiBold" style={themedStyles.settingTitle}>
                🧹 Database Cleanup
              </ThemedText>
              <ThemedText style={[themedStyles.settingDescription, { marginBottom: 12, color: '#856404' }]}>
                Remove ALL your bubbles.
              </ThemedText>
              <TouchableOpacity
                onPress={handleCleanupTestBubbles}
                style={[
                  themedStyles.menuButton, 
                  themedStyles.cleanupButton, 
                  themedStyles.fullWidthButton,
                  (isCleaningUp || loading || !isConnected || !account?.bech32Address) && themedStyles.disabledButton
                ]}
                disabled={isCleaningUp || loading || !isConnected || !account?.bech32Address}
              >
                <ThemedText style={themedStyles.buttonText}>
                  {isCleaningUp ? "Cleaning up..." : 
                   !isConnected || !account?.bech32Address ? "Connect wallet first" : 
                   "Delete All My Bubbles"}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={logout}
              style={[themedStyles.menuButton, themedStyles.logoutButton, themedStyles.fullWidthButton]}
            >
              <ThemedText style={themedStyles.buttonText}>Logout</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
} 