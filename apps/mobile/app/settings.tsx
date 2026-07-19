/* eslint-disable react-hooks/exhaustive-deps */
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Animated } from "react-native"; 
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/auth-context";
import {
  getBiometricType,
  getBiometricTypeName,
  isBiometricAvailable,
  isBiometricLoginEnabled,
} from "@/lib/biometric";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, enableBiometric, disableBiometric } = useAuth();

  const [darkMode, setDarkMode] = useState(false);
  const [eventNotifs, setEventNotifs] = useState(true);
  const [clubNotifs, setClubNotifs] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | "iris" | "undefined">("undefined");

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
    
    // Check biometric availability
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricLoginEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
      }
    };
    checkBiometric();
  }, []);

  const toggleDarkMode = async (val: boolean) => {
    setDarkMode(val);
    await AsyncStorage.setItem("@dark_mode", String(val));
  };
  const toggleEventNotifs = async (val: boolean) => {
    setEventNotifs(val);
    await AsyncStorage.setItem("@notifs_events", String(val));
  };
  const toggleClubNotifs = async (val: boolean) => {
    setClubNotifs(val);
    await AsyncStorage.setItem("@notifs_clubs", String(val));
  };

  const toggleBiometric = async (val: boolean) => {
    if (val && session?.user?.email && session) {
      try {
        await enableBiometric(session.user.email, {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });
        console.log("Biometric session stored successfully for:", session.user.email);
      } catch (e) {
        // Handle user cancellation gracefully
        if (e instanceof Error && e.message.includes("user_cancel")) {
          console.log("Biometric verification cancelled by user");
          // Don't enable the toggle if user cancelled
          setBiometricEnabled(false);
          return;
        }
        console.error("Error enabling biometric login:", e);
        setBiometricEnabled(false);
        return;
      }
    } else {
      // Show confirmation dialog before disabling
      Alert.alert(
        "Disable Biometric Login",
        "Are you sure you want to disable biometric login? You will need to use your password to sign in.",
        [
          { text: "Cancel", style: "cancel", onPress: () => setBiometricEnabled(true) },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              await disableBiometric();
            },
          },
        ],
        { cancelable: false },
      );
      return;
    }
    setBiometricEnabled(val);
  };

  const handleChangePassword = () => {
    router.push("/change-password");
  };

  const handleNotificationSettings = () => {
    Alert.alert("Notification Settings", "Customize your notification preferences");
  };

  const handlePrivacySettings = () => {
    Alert.alert("Privacy Settings", "Coming soon! This feature is under development.");
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

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Pressable style={styles.menuItem} onPress={handleChangePassword}>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="lock" size={20} color="#A93C40" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Change Password</Text>
                <Text style={styles.menuDesc}>Update your account password</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.menuItem} onPress={handleNotificationSettings}>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="bell.fill" size={20} color="#A93C40" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Notification Settings</Text>
                <Text style={styles.menuDesc}>Customize your notifications</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.menuItem} onPress={handlePrivacySettings}>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="person.fill" size={20} color="#A93C40" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Privacy Settings</Text>
                <Text style={styles.menuDesc}>Control your privacy (Coming soon)</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#9CA3AF" />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.menuIconContainer}>
                  <IconSymbol name="moon" size={20} color="#A93C40" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Dark Mode</Text>
                  <Text style={styles.menuDesc}>Use dark theme</Text>
                </View>
              </View>
              <Switch 
                value={darkMode} 
                onValueChange={toggleDarkMode} 
                trackColor={{ true: "#A93C40", false: "#E5E7EB" }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.menuIconContainer}>
                  <IconSymbol name="bell.fill" size={20} color="#A93C40" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Event Reminders</Text>
                  <Text style={styles.menuDesc}>Get notified before events</Text>
                </View>
              </View>
              <Switch 
                value={eventNotifs} 
                onValueChange={toggleEventNotifs} 
                trackColor={{ true: "#A93C40", false: "#E5E7EB" }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.menuIconContainer}>
                  <IconSymbol name="flag.fill" size={20} color="#A93C40" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>Club Activity</Text>
                  <Text style={styles.menuDesc}>Updates from your clubs</Text>
                </View>
              </View>
              <Switch 
                value={clubNotifs} 
                onValueChange={toggleClubNotifs} 
                trackColor={{ true: "#A93C40", false: "#E5E7EB" }}
              />
            </View>

            {/* Biometric toggle - only show if available */}
            {biometricAvailable && (
              <>
                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons 
                        name={biometricType === "face" ? "scan" : "finger-print"} 
                        size={20} 
                        color="#A93C40" 
                      />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuText}>
                        {getBiometricTypeName(biometricType)} Login
                      </Text>
                      <Text style={styles.menuDesc}>
                        Use {getBiometricTypeName(biometricType)} to sign in
                      </Text>
                    </View>
                  </View>
                  <Switch 
                    value={biometricEnabled} 
                    onValueChange={toggleBiometric} 
                    trackColor={{ true: "#A93C40", false: "#E5E7EB" }}
                  />
                </View>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <IconSymbol name="info.circle.fill" size={20} color="#A93C40" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuText}>Version</Text>
                <Text style={styles.menuDesc}>1.0.0</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
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
  content: { padding: 20, gap: 24 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextContainer: { flex: 1 },
  menuText: { fontSize: 15, fontWeight: "600", color: "#1A2B4A", marginBottom: 2 },
  menuDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  settingInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 16, paddingRight: 16 },
  divider: { height: 1, backgroundColor: "#F0F2F5", marginVertical: 12 },
});