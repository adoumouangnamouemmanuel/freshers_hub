import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, Animated } from "react-native"; 
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { hasRole } from "@/lib/permissions";
import { apiRequest } from "@/lib/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { session, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isStudent = hasRole(session?.user?.roles || [], "student");

  // Animation for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (session?.user) {
      setPhone(session.user.phone || "");
    }
  }, [session]);

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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ user: any }>("/auth/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      
      if (response.user) {
        updateUser(response.user);
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} style={styles.saveBtn} disabled={isLoading}>
          <Text style={[styles.saveBtnText, isLoading && styles.saveBtnTextDisabled]}>
            {isLoading ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {session?.user?.fullName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
            <Text style={styles.avatarHint}>Profile photo coming soon</Text>
          </View>

          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyTitle}>Profile Details</Text>
            
            <View style={styles.readOnlyItem}>
              <IconSymbol name="person.fill" size={20} color="#A93C40" />
              <View style={styles.readOnlyContent}>
                <Text style={styles.readOnlyLabel}>Full Name</Text>
                <Text style={styles.readOnlyValue}>{session?.user?.fullName || "N/A"}</Text>
              </View>
            </View>

            <View style={styles.readOnlyItem}>
              <IconSymbol name="envelope.fill" size={20} color="#A93C40" />
              <View style={styles.readOnlyContent}>
                <Text style={styles.readOnlyLabel}>Email</Text>
                <Text style={styles.readOnlyValue}>{session?.user?.email || "N/A"}</Text>
              </View>
            </View>

            {isStudent && (
              <>
                <View style={styles.readOnlyItem}>
                  <IconSymbol name="book.fill" size={20} color="#A93C40" />
                  <View style={styles.readOnlyContent}>
                    <Text style={styles.readOnlyLabel}>Major</Text>
                    <Text style={styles.readOnlyValue}>{session?.user?.major || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.readOnlyItem}>
                  <IconSymbol name="person.fill" size={20} color="#A93C40" />
                  <View style={styles.readOnlyContent}>
                    <Text style={styles.readOnlyLabel}>Student ID</Text>
                    <Text style={styles.readOnlyValue}>
                      {session?.user?.studentProfile?.schoolId || "N/A"}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Editable Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <IconSymbol name="phone.fill" size={20} color="#A93C40" />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardText}>
              Only phone number can be edited. Name, email, and student information are read-only. Contact support if you need to update these details.
            </Text>
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
  saveBtn: { padding: 8, paddingHorizontal: 16 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#A93C40" },
  saveBtnTextDisabled: { opacity: 0.5 },
  content: { padding: 20, gap: 24 },
  avatarSection: { alignItems: "center", marginTop: 12, marginBottom: 8 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#A93C40",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 40, fontWeight: "800", color: "#FFFFFF" },
  avatarHint: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  readOnlyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  readOnlyTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4A", marginBottom: 20 },
  readOnlyItem: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  readOnlyContent: { flex: 1 },
  readOnlyLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600", marginBottom: 4 },
  readOnlyValue: { fontSize: 16, color: "#1A2B4A", fontWeight: "600" },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  formTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4A", marginBottom: 20 },
  formGroup: { marginBottom: 0 },
  label: { fontSize: 14, fontWeight: "600", color: "#1A2B4A", marginBottom: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    gap: 12,
  },
  input: { flex: 1, fontSize: 15, color: "#1A2B4A" },
  infoCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  infoCardText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
});