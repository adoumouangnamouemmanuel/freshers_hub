import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_UNITS = [
  {
    icon: "🤝",
    name: "Peer Coaching",
    desc: "Sessions with your assigned peer coach.",
    day: "Week 3 · Day 11",
  },
  {
    icon: "💬",
    name: "Counselling",
    desc: "Confidential support from the counselling team.",
    day: "Week 3 · Day 14",
  },
  {
    icon: "📚",
    name: "Academic Advising",
    desc: "Meet your academic advisor for course guidance.",
    day: "Week 3 · Day 14",
  },
  {
    icon: "🌍",
    name: "Buddy Up (ODIP)",
    desc: "Your assigned international buddy.",
    day: "Week 3 · Day 15",
  },
];

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.header}>Support</Text>
        <Text style={styles.subHeader}>
          All support units are accessible from here once built out.
        </Text>
        {SUPPORT_UNITS.map((unit) => (
          <View key={unit.name} style={styles.card}>
            <Text style={styles.cardIcon}>{unit.icon}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{unit.name}</Text>
              <Text style={styles.cardDesc}>{unit.desc}</Text>
              <Text style={styles.cardBadge}>{unit.day}</Text>
            </View>
          </View>
        ))}
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
    alignItems: "flex-start",
    gap: 14,
  },
  cardIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1a17",
  },
  cardDesc: {
    fontSize: 13,
    color: "#7c7168",
    lineHeight: 19,
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#a89b8f",
    marginTop: 2,
  },
});
