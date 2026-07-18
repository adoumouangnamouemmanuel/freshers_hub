import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { hasRole } from "@/lib/permissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  // useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  // const insets = useSafeAreaInsets();

  const [darkMode, setDarkMode] = useState(false);
  const [eventNotifs, setEventNotifs] = useState(true);
  const [clubNotifs, setClubNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("@dark_mode").then((val) => {
      if (val !== null) setDarkMode(val === "true");
    });
    AsyncStorage.getItem("@notifs_events").then((val) => {
      if (val !== null) setEventNotifs(val === "true");
    });
    AsyncStorage.getItem("@notifs_clubs").then((val) => {
      if (val !== null) setClubNotifs(val === "true");
    });
    AsyncStorage.getItem("@notifs_push").then((val) => {
      if (val !== null) setPushNotifs(val === "true");
    });
  }, []);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleShare = async () => {
    Alert.alert("Share Freshers Hub", "Share the app with your friends!");
  };

  const handleRate = () => {
    Alert.alert(
      "Rate Us",
      "Thank you for using Freshers Hub! Please rate us on the App Store.",
    );
  };

  const handleReport = () => {
    Alert.alert(
      "Report a Problem",
      "Thank you for helping us improve. Please describe your issue.",
    );
  };

  const handleHelp = () => {
    Alert.alert("Help & Support", "Contact us at support@freshershub.com");
  };

  // Animation for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";
  const fullName = session?.user.fullName ?? "User";
  const email = session?.user.email ?? "";
  const phone = session?.user.phone ?? "N/A";
  const country = session?.user.country ?? "N/A";
  const major = session?.user.major ?? "N/A";
  const avatarUrl = session?.user.avatarUrl ?? null;
  const classYear = session?.user.classYear ?? "N/A";
  const createdAt = session?.user.createdAt ?? "September 2024";

  const joinedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "September 2024";

  const isStudent = hasRole(session?.user.roles || [], "student");
  const studentProfile = session?.user.studentProfile;
  const schoolId = studentProfile?.schoolId ?? "N/A";

  const uniqueRoles = [
    ...new Set(
      (session?.user.roles || []).map((r) =>
        typeof r === "string" ? r : r.name,
      ),
    ),
  ];
  const formattedRoles = uniqueRoles.map((role) =>
    role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.coverHeader}>
            <View style={styles.coverImagePlaceholder}>
              <IconSymbol name="building.2.fill" size={48} color="#FFFFFF" />
            </View>
            <View style={styles.coverOverlay} />
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{userInitial}</Text>
                </View>
              )}
            </View>

            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{email}</Text>

            {formattedRoles.length > 0 && (
              <View style={styles.roleContainer}>
                {formattedRoles.map((role, index) => (
                  <View key={`${role}-${index}`} style={styles.roleBadge}>
                    <Text style={styles.roleText}>{role}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {!!phone && phone !== "N/A" && (
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="phone.fill" size={20} color="#A93C40" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{phone}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <IconSymbol name="envelope.fill" size={20} color="#A93C40" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
            </View>

            {!!country && country !== "N/A" && (
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="mappin.and.ellipse" size={20} color="#A93C40" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Country</Text>
                  <Text style={styles.infoValue}>{country}</Text>
                </View>
              </View>
            )}

            {!!major && major !== "N/A" && (
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="book.fill" size={20} color="#A93C40" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Major</Text>
                  <Text style={styles.infoValue}>{major}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <IconSymbol name="calendar" size={20} color="#A93C40" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>{joinedDate}</Text>
              </View>
            </View>
          </View>

          {isStudent && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Academic Information</Text>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="person.fill" size={20} color="#A93C40" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Student ID</Text>
                  <Text style={styles.infoValue}>{schoolId}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="calendar" size={20} color="#A93C40" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Class Of</Text>
                  <Text style={styles.infoValue}>{classYear}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <Text style={styles.sectionTitle}>Settings</Text>
            </View>

            <Pressable style={styles.settingsItem} onPress={() => router.push("/edit-profile")}>
              <View style={styles.settingsIconContainer}>
                <IconSymbol name="pencil" size={20} color="#A93C40" />
              </View>
              <Text style={styles.settingsText}>Edit Profile</Text>
              <View style={styles.settingsSpacer} />
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>

            <View style={styles.settingsDivider} />

            <Pressable style={styles.settingsItem} onPress={() => router.push("/settings")}>
              <View style={styles.settingsIconContainer}>
                <IconSymbol name="gearshape.fill" size={20} color="#A93C40" />
              </View>
              <Text style={styles.settingsText}>Settings</Text>
              <View style={styles.settingsSpacer} />
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <Text style={styles.sectionTitle}>Support</Text>
            </View>

            <Pressable style={styles.settingsItem} onPress={handleHelp}>
              <View style={styles.settingsIconContainer}>
                <IconSymbol
                  name="questionmark.circle.fill"
                  size={20}
                  color="#A93C40"
                />
              </View>
              <Text style={styles.settingsText}>Help & Support</Text>
              <View style={styles.settingsSpacer} />
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>

            <View style={styles.settingsDivider} />

            <Pressable style={styles.settingsItem} onPress={handleReport}>
              <View style={styles.settingsIconContainer}>
                <IconSymbol
                  name="exclamationmark.triangle.fill"
                  size={20}
                  color="#A93C40"
                />
              </View>
              <Text style={styles.settingsText}>Report a Problem</Text>
              <View style={styles.settingsSpacer} />
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>

            <View style={styles.settingsDivider} />

            <Pressable style={styles.settingsItem} onPress={handleRate}>
              <View style={styles.settingsIconContainer}>
                <IconSymbol name="star.fill" size={20} color="#A93C40" />
              </View>
              <Text style={styles.settingsText}>Rate App</Text>
              <View style={styles.settingsSpacer} />
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>

            <View style={styles.settingsDivider} />

            <Pressable style={styles.settingsItem} onPress={handleShare}>
              <View style={styles.settingsIconContainer}>
                <IconSymbol
                  name="square.and.arrow.up"
                  size={20}
                  color="#A93C40"
                />
              </View>
              <Text style={styles.settingsText}>Share App</Text>
              <View style={styles.settingsSpacer} />
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <IconSymbol name="log-out" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>

          <Text style={styles.version}>Version 1.0.0</Text>

          <View style={{ height: 40 }} />
        </Animated.View>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4A" },
  closeBtn: { padding: 8, marginLeft: -8 },
  coverHeader: {
    position: "relative",
    height: 200,
  },
  coverImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A2B4A",
    alignItems: "center",
    justifyContent: "center",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#A93C40",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4A",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
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
  infoSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2B4A",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#1A2B4A",
    fontWeight: "700",
  },
  settingsSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    overflow: "hidden",
  },
  settingsSectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingsText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2B4A",
  },
  settingsSpacer: {
    flex: 1,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: "#F0F2F5",
    marginLeft: 64,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#A93C40",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  version: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 24,
    fontWeight: "500",
  },
});