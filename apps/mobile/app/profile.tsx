import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";
  const fullName = session?.user.fullName ?? "Student";
  const email = session?.user.email ?? "";
  const schoolId = session?.user.studentProfile?.schoolId ?? "N/A";
  const classYear = session?.user.studentProfile?.graduationYear ?? "N/A";
  
  const roles = session?.user.roles?.map(r => r.name) || ["Student"];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleContainer}>
            {roles.map(role => (
              <View key={role} style={styles.roleBadge}>
                <Text style={styles.roleText}>{role.replace("_", " ")}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Academic Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student ID</Text>
            <Text style={styles.infoValue}>{schoolId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class Of</Text>
            <Text style={styles.infoValue}>{classYear}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>
          <Pressable style={styles.actionRow}>
            <IconSymbol name="heart.text.square.fill" size={20} color="#6B7280" />
            <Text style={styles.actionText}>Notification Preferences</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.actionRow}>
            <IconSymbol name="map.fill" size={20} color="#6B7280" />
            <Text style={styles.actionText}>Privacy Settings</Text>
          </Pressable>
        </View>

        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  closeBtn: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#A93C40",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4A",
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  roleBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  roleText: {
    color: "#A93C40",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#1A2B4A",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    color: "#4B5563",
    fontWeight: "500",
  },
  signOutBtn: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginTop: 12,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutText: {
    color: "#A93C40",
    fontWeight: "700",
    fontSize: 16,
  },
});
