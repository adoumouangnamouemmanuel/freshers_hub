import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";

export default function FeedScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";
  const roles =
    session?.user.roles.map((r) => r.name).join(", ") ?? "student";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Welcome to Fresher Hub</Text>
          </View>
          <Pressable style={styles.signOutPill} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {session?.user.fullName?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.identityName}>{session?.user.fullName}</Text>
            <Text style={styles.identityEmail}>{session?.user.email}</Text>
            {session?.user.studentProfile ? (
              <Text style={styles.identityMeta}>
                {session.user.studentProfile.schoolId} · Class of{" "}
                {session.user.studentProfile.graduationYear}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Role chips */}
        <View style={styles.chipRow}>
          {session?.user.roles.map((role) => (
            <View key={role.name + (role.unit_name ?? "")} style={styles.chip}>
              <Text style={styles.chipText}>{role.name.replace(/_/g, " ")}</Text>
            </View>
          ))}
        </View>

        {/* Empty feed placeholder */}
        <View style={styles.feedPlaceholder}>
          <Text style={styles.feedPlaceholderIcon}>📰</Text>
          <Text style={styles.feedPlaceholderTitle}>Your feed is empty</Text>
          <Text style={styles.feedPlaceholderBody}>
            Announcements, campus updates, and events for your class will appear
            here once they're posted.
          </Text>
        </View>

        {/* Day 3 status note */}
        <View style={styles.statusNote}>
          <Text style={styles.statusDot}>●</Text>
          <Text style={styles.statusText}>
            Week 1 / Day 3 complete — logged in as{" "}
            <Text style={styles.statusBold}>{roles}</Text>, token stored
            securely.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4efe7",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f1a17",
    lineHeight: 30,
  },
  subGreeting: {
    fontSize: 14,
    color: "#7c7168",
    marginTop: 2,
  },
  signOutPill: {
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: "#dccfbe",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5f554d",
  },

  // Identity card
  identityCard: {
    backgroundColor: "#fffaf3",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dccfbe",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1f1a17",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fffaf2",
  },
  identityInfo: {
    flex: 1,
    gap: 3,
  },
  identityName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f1a17",
  },
  identityEmail: {
    fontSize: 13,
    color: "#7c7168",
  },
  identityMeta: {
    fontSize: 12,
    color: "#a89b8f",
    marginTop: 1,
  },

  // Role chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#1f1a17",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    color: "#fffaf2",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Feed placeholder
  feedPlaceholder: {
    backgroundColor: "#fffaf3",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dccfbe",
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  feedPlaceholderIcon: {
    fontSize: 36,
  },
  feedPlaceholderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3c3229",
  },
  feedPlaceholderBody: {
    fontSize: 14,
    color: "#7c7168",
    lineHeight: 21,
    textAlign: "center",
  },

  // Status note
  statusNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#eef7ee",
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  statusDot: {
    color: "#3a8a3a",
    fontSize: 10,
    marginTop: 3,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: "#2d5e2d",
    lineHeight: 20,
  },
  statusBold: {
    fontWeight: "700",
  },
});
