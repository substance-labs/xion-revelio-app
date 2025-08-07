import { View, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from '@/hooks/useThemeColor';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.welcomeContainer}>
        <IconSymbol 
          name="bubble.left.and.bubble.right" 
          size={64} 
          color={iconColor}
          style={styles.welcomeIcon}
        />
        <ThemedText type="title" style={styles.welcomeTitle}>
          Revelio
        </ThemedText>
        <ThemedText style={styles.welcomeDescription}>
          Go to the Bubbles tab to discover and join verified chat spaces.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    marginBottom: 20,
  },
  welcomeTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
});
