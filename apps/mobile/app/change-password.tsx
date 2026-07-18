import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from "react-native"; 
import { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual API call to change password
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to change password. Please try again.");
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
        <Text style={styles.headerTitle}>Change Password</Text>
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
        <View style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="lock" size={20} color="#A93C40" />
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="lock" size={20} color="#A93C40" />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="lock" size={20} color="#A93C40" />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={20} color="#A93C40" />
          <Text style={styles.infoText}>
            Password must be at least 6 characters. Make sure it&apos;s something you can remember!
          </Text>
        </View>
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
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  formGroup: { marginBottom: 24 },
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
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  infoText: { flex: 1, fontSize: 14, color: "#6B7280", lineHeight: 20 },
});