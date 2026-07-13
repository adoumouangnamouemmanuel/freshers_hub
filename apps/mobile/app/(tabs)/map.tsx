import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Campus Map</Text>
        <Text style={styles.body}>
          Interactive campus map with pinned buildings coming in Week 2 / Day 8.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming — Week 2 · Day 8</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4efe7",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  icon: {
    fontSize: 52,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f1a17",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: "#7c7168",
    lineHeight: 22,
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: "#dccfbe",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b5e54",
  },
});
