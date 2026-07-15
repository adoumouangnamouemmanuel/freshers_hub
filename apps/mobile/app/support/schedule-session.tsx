import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator, Platform, Alert, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";
import Animated, { FadeInDown } from "react-native-reanimated";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from "expo-image";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function ScheduleSessionScreen() {
  const router = useRouter();
  const { userId, name, sessionId, editDate, editLocation, editDescription, editStudentId, editStudentName, asCoach } = useLocalSearchParams();
  const isEditMode = !!sessionId;
  const isAsCoach = asCoach === "true";
  const { session } = useAuth();
  const token = session?.accessToken;
  const insets = useSafeAreaInsets();
  const isCoachAdmin = session?.user.roles.some((r: any) => r.name === "coach_admin" || r.name === "admin");
  const isCoach = session?.user.roles.some((r: any) => r.name === "peer_coach");

  const [loading, setLoading] = useState(false);
  
  // Date and Time state
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // User Selection state
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    location: (editLocation as string) || "",
    description: (editDescription as string) || "",
    targetUserId: (editStudentId as string) || (userId as string) || "",
    targetUserName: (editStudentName as string) || (name as string) || "",
  });

  useEffect(() => {
    if (editDate) {
      setDate(new Date(editDate as string));
    }
  }, [editDate]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await fetch(`${API_URL}/support/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const openUserModal = () => {
    if (users.length === 0) fetchUsers();
    setShowUserModal(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!form.location) {
      Alert.alert("Missing Fields", "Please enter a location or meeting link.");
      return;
    }

    if (!form.targetUserId) {
      Alert.alert("Missing User", "Please select a user to schedule with.");
      return;
    }

    setLoading(true);
    const scheduledAt = date.toISOString();

    try {
      const endpoint = isEditMode 
        ? `/support/sessions/${sessionId}`
        : isCoachAdmin ? "/support/admin/sessions" : "/support/sessions";
      const method = isEditMode ? "PUT" : "POST";
      
      const payload = isEditMode ? {
        location: form.location,
        description: form.description,
        scheduledAt,
      } : isCoachAdmin || isAsCoach ? {
        unitId: 1,
        academicYearId: 1,
        studentId: form.targetUserId,
        providerId: session?.user.id,
        scheduledAt,
        location: form.location,
        description: form.description,
        withType: "peer_coach"
      } : {
        unitId: 1,
        academicYearId: 1,
        providerId: form.targetUserId, 
        scheduledAt,
        location: form.location,
        description: form.description,
        withType: "peer_coach"
      };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Alert.alert("Success", isEditMode ? "Session updated successfully!" : "Session has been scheduled successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.error || (isEditMode ? "Failed to update session." : "Failed to schedule session."));
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <IconSymbol name="xmark" size={24} color="#1A2B4A" />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditMode ? "Edit Session" : "Schedule Session"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          {/* Only show user picker when creating, not editing */}
          {!isEditMode && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Scheduling with</Text>
              {form.targetUserName ? (
                <Pressable style={styles.selectedUserCard} onPress={isCoachAdmin ? openUserModal : undefined}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{form.targetUserName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.selectedUserName}>{form.targetUserName}</Text>
                  {isCoachAdmin && <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />}
                </Pressable>
              ) : (
                isCoachAdmin ? (
                  <Pressable style={styles.selectUserBtn} onPress={openUserModal}>
                    <IconSymbol name="person.fill" size={20} color="#A93C40" />
                    <Text style={styles.selectUserText}>Select a user from Students</Text>
                    <IconSymbol name="chevron.right" size={16} color="#9BA3AE" />
                  </Pressable>
                ) : (
                  <View style={[styles.selectUserBtn, { opacity: 0.5 }]}>
                    <Text style={styles.selectUserText}>No user selected.</Text>
                  </View>
                )
              )}
            </View>
          )}
          {isEditMode && (
            <View style={[styles.formGroup, { backgroundColor: "#F3F4F6", borderRadius: 12, padding: 16 }]}>
              <Text style={[styles.label, { marginBottom: 4 }]}>Editing session for</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{form.targetUserName?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <Text style={styles.selectedUserName}>{form.targetUserName}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.row}>
              <Pressable style={[styles.inputContainer, { flex: 2, marginRight: 12 }]} onPress={() => setShowDatePicker(true)}>
                <IconSymbol name="calendar" size={18} color="#6B7280" style={styles.inputIcon} />
                <Text style={styles.inputText}>
                  {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </Pressable>
              
              <Pressable style={[styles.inputContainer, { flex: 1 }]} onPress={() => setShowTimePicker(true)}>
                <IconSymbol name="clock.fill" size={18} color="#6B7280" style={styles.inputIcon} />
                <Text style={styles.inputText}>
                  {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {(showDatePicker || Platform.OS === 'ios') && showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        
        {(showTimePicker || Platform.OS === 'ios') && showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location or Link</Text>
            <View style={styles.inputContainer}>
              <IconSymbol name="mappin.and.ellipse" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Student Center Room 101 or Zoom Link" 
                value={form.location} 
                onChangeText={t => setForm({...form, location: t})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(175).duration(400)}>
          <View style={[styles.formGroup, { marginTop: 12 }]}>
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
              <IconSymbol name="doc.text.fill" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { height: 60 }]} 
                placeholder="What is this session about?" 
                value={form.description} 
                onChangeText={t => setForm({...form, description: t})}
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>
          </View>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.infoCard}>
            <IconSymbol name="info.circle.fill" size={20} color="#0369A1" />
            <Text style={styles.infoText}>
              A calendar invitation will automatically be sent to both participants once this session is confirmed.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <Pressable 
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name={isEditMode ? "checkmark.circle.fill" : "paperplane.fill"} size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>{isEditMode ? "Save Changes" : "Confirm Session"}</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Select User Modal */}
      <Modal visible={showUserModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowUserModal(false)}>
        <SafeAreaView style={styles.modalScreen} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select User</Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={24} color="#1A2B4A" />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", backgroundColor: "#FFFFFF" }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 12, height: 40 }}>
              <IconSymbol name="magnifyingglass" size={18} color="#9CA3AF" />
              <TextInput
                style={{ flex: 1, marginLeft: 8, fontSize: 15, color: "#1A2B4A" }}
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <IconSymbol name="xmark.circle.fill" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ScrollView style={styles.scroll}>
            {fetchingUsers ? (
              <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 40 }} />
            ) : (
              users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase())).map((u, index) => (
                <TouchableOpacity 
                  key={`${u.id}-${index}`} 
                  style={styles.userListItem}
                  onPress={() => {
                    setForm({ ...form, targetUserId: u.id, targetUserName: u.name });
                    setShowUserModal(false);
                  }}
                >
                  {u.avatar_url ? (
                    <Image source={{ uri: u.avatar_url }} style={styles.userListAvatar} />
                  ) : (
                    <View style={styles.userListAvatarFallback}>
                      <Text style={styles.userListAvatarText}>{u.name ? u.name.charAt(0).toUpperCase() : '?'}</Text>
                    </View>
                  )}
                  <View style={styles.userListInfo}>
                    <Text style={styles.userListName}>{u.name}</Text>
                    <Text style={styles.userListRole}>{u.type === "peer_coach" ? "Coach" : "Fresher"}</Text>
                  </View>
                  <IconSymbol name="plus" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    borderBottomColor: "#F3F4F6",
  },
  closeBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4A" },
  
  scroll: { flex: 1 },
  content: { padding: 24, gap: 24 },
  
  formGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700", color: "#1A2B4A", marginLeft: 4 },
  
  row: { flexDirection: "row" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 },
      android: { elevation: 1 }
    })
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: "#1A2B4A" },
  inputText: { fontSize: 15, color: "#1A2B4A", fontWeight: "500" },
  
  selectedUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4", 
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 16,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  avatarInitial: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  selectedUserName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#065F46" },
  
  selectUserBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECDD3",
    padding: 16,
    borderRadius: 16,
    borderStyle: "dashed"
  },
  selectUserText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: "500", color: "#A93C40" },
  
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: "center",
    marginTop: 8
  },
  infoText: { flex: 1, fontSize: 13, color: "#0369A1", lineHeight: 20 },
  
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: "#A93C40",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#A93C40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  // Modal styles
  modalScreen: { flex: 1, backgroundColor: "#F8F9FA" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF"
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4A" },
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF"
  },
  userListAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#F3F4F6" },
  userListAvatarFallback: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#1A2B4A", alignItems: "center", justifyContent: "center" },
  userListAvatarText: { color: "#FFFFFF", fontWeight: "700" },
  userListInfo: { flex: 1 },
  userListName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  userListRole: { fontSize: 13, color: "#6B7280", marginTop: 2 }
});
