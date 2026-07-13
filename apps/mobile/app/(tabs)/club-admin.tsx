import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClubAdminScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🌟</Text>
        </View>
        <Text style={styles.title}>My Club</Text>
        <Text style={styles.subtitle}>
          This tab is only visible to users with the{" "}
          <Text style={styles.roleTag}>club_lead</Text> role.
        </Text>
        
        <View style={styles.roadmapBadge}>
          <Text style={styles.roadmapText}>
            Roadmap: Week 4 will populate this dashboard with member lists,
            event creation, and announcements.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: "#dccfbe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A2B4A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#9BA3AE",
    textAlign: "center",
    lineHeight: 22,
  },
  roleTag: {
    fontWeight: "700",
    color: "#A93C40",
  },
  roadmapBadge: {
    marginTop: 24,
    backgroundColor: "#f4f5f7",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#C9933A",
  },
  roadmapText: {
    fontSize: 13,
    color: "#5f6874",
    lineHeight: 20,
    fontWeight: "500",
  },
});
