import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HELP_CATEGORIES = [
  { icon: "🏢", name: "ODIP", desc: "International student support" },
  { icon: "💻", name: "IT & Support Center", desc: "Tech help and printing" },
  { icon: "🎓", name: "SLE", desc: "Student Life & Engagement" },
  { icon: "📋", name: "Registrar", desc: "Academic records and transcripts" },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.header}>Help Center</Text>
        <Text style={styles.subHeader}>
          Office contacts, FAQs, and on-campus resources — coming in Week 2.
        </Text>

        {HELP_CATEGORIES.map((item) => (
          <View key={item.name} style={styles.card}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <View style={styles.soon}>
              <Text style={styles.soonText}>Soon</Text>
            </View>
          </View>
        ))}

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming — Week 2 · Days 6–7</Text>
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
    padding: 20,
    gap: 12,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1f1a17",
    marginTop: 8,
    marginBottom: 2,
  },
  subHeader: {
    fontSize: 14,
    color: "#7c7168",
    lineHeight: 21,
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#fffaf3",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dccfbe",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIcon: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1a17",
  },
  cardDesc: {
    fontSize: 13,
    color: "#7c7168",
  },
  soon: {
    backgroundColor: "#f0ebe3",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  soonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8a7b6e",
  },
  badge: {
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: "#dccfbe",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b5e54",
  },
});
