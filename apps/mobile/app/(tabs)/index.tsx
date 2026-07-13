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
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function FeedScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";
  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{userInitial}</Text>
            </View>
          </View>
          
          <View style={styles.heroDivider} />
          
          <View style={styles.heroBottom}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentId}>
                {session?.user.studentProfile?.schoolId ?? "Student ID Pending"}
              </Text>
              <Text style={styles.studentClass}>
                Class of {session?.user.studentProfile?.graduationYear ?? "2028"}
              </Text>
            </View>
            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionTile}
              onPress={() => router.push("/(tabs)/help")}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#A93C4015" }]}>
                <IconSymbol name="heart.text.square.fill" size={24} color="#A93C40" />
              </View>
              <Text style={styles.actionTileText}>Support</Text>
            </Pressable>

            <Pressable style={styles.actionTile}>
              <View style={[styles.actionIconBg, { backgroundColor: "#C9933A15" }]}>
                <IconSymbol name="newspaper.fill" size={24} color="#C9933A" />
              </View>
              <Text style={styles.actionTileText}>News</Text>
            </Pressable>

            <Pressable style={styles.actionTile}>
              <View style={[styles.actionIconBg, { backgroundColor: "#1A2B4A15" }]}>
                <IconSymbol name="map.fill" size={24} color="#1A2B4A" />
              </View>
              <Text style={styles.actionTileText}>Map</Text>
            </Pressable>
          </View>
        </View>

        {/* Feed Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Campus Updates</Text>
            <Text style={styles.seeAllText}>See all</Text>
          </View>
          
          <View style={styles.emptyFeedCard}>
            <View style={styles.emptyFeedIcon}>
              <IconSymbol name="newspaper.fill" size={28} color="#9BA3AE" />
            </View>
            <Text style={styles.emptyFeedTitle}>You're all caught up!</Text>
            <Text style={styles.emptyFeedDesc}>
              Announcements and events for your class will appear here.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 28,
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#A93C40", // Ashesi Maroon
    borderRadius: 24,
    padding: 24,
    shadowColor: "#A93C40",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: "#A93C40",
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 20,
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentInfo: {
    flex: 1,
  },
  studentId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  signOutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Sections
  section: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2B4A",
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A93C40",
    marginBottom: 2,
  },

  // Action Grid
  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTileText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2B4A",
  },

  // Empty Feed
  emptyFeedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyFeedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyFeedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  emptyFeedDesc: {
    fontSize: 14,
    color: "#5f6874",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
