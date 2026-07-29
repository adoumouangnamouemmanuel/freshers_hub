/**
 * SendNotificationModal
 *
 * Used by coaches, counsellors, and admins to send an immediate push+in-app
 * notification or schedule a reminder for a user.
 *
 * Props:
 *  - visible: boolean
 *  - onClose: () => void
 *  - targetUserId: string
 *  - targetUserName: string
 *  - accessToken: string
 *  - defaultCategory?: string  (e.g. "nudge", "reminder")
 */

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { API_URL } from "@/lib/api";

type Props = {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  accessToken: string;
  defaultCategory?: string;
  senderType?: "coach" | "counsellor" | "advisor" | "admin";
};

const getQuickMessages = (senderType?: string) => {
  const roleName = senderType === 'counsellor' ? 'counsellor' : 
                   senderType === 'advisor' ? 'advisor' : 
                   'coach';
  return [
    { label: "Session Reminder", title: "Upcoming Session", body: "You have a session coming up soon. Don't forget to show up!" },
    { label: "Nudge", title: "Stay on Track 💪", body: `Just checking in! Remember to complete your ${roleName} sessions.` },
    { label: "Check-in", title: "How are you doing?", body: `Your ${roleName} wants to check in. Reply or book a session when you're ready.` },
  ];
};

export default function SendNotificationModal({
  visible,
  onClose,
  targetUserId,
  targetUserName,
  accessToken,
  defaultCategory = "nudge",
  senderType,
}: Props) {
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<Date>(new Date(Date.now() + 3600000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [sending, setSending]     = useState(false);
  const [category]                = useState(defaultCategory);

  const reset = () => {
    setTitle("");
    setBody("");
    setIsScheduled(false);
    setScheduleDateTime(new Date(Date.now() + 3600000));
  };

  const applyQuick = (q: any) => {
    setTitle(q.title);
    setBody(q.body);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing fields", "Please enter both a title and a message.");
      return;
    }

    let scheduledAt: string | null = null;
    if (isScheduled) {
      if (scheduleDateTime <= new Date()) {
        Alert.alert("Invalid date", "Please choose a future date and time.");
        return;
      }
      scheduledAt = scheduleDateTime.toISOString();
    }

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          toUserId: targetUserId,
          title: title.trim(),
          body: body.trim(),
          category,
          scheduledAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Send failed");

      Alert.alert(
        "Sent! ✓",
        isScheduled
          ? `Reminder scheduled for ${scheduleDateTime.toLocaleDateString()} at ${scheduleDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : `Notification sent to ${targetUserName}.`
      );
      reset();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not send notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Send Notification</Text>
              <Text style={styles.headerSub}>To: {targetUserName}</Text>
            </View>
            <Pressable onPress={() => { reset(); onClose(); }} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={18} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Quick templates */}
            <Text style={styles.sectionLabel}>Quick Templates</Text>
            <View style={styles.quickRow}>
              {getQuickMessages(senderType).map((q) => (
                <Pressable key={q.label} style={styles.quickPill} onPress={() => applyQuick(q)}>
                  <Text style={styles.quickPillText}>{q.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.sectionLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Notification title…"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Body */}
            <Text style={styles.sectionLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your message…"
              placeholderTextColor="#9CA3AF"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />

            {/* Schedule toggle */}
            <View style={styles.scheduleRow}>
              <View>
                <Text style={styles.sectionLabel}>Schedule as Reminder</Text>
                <Text style={styles.scheduleDesc}>Send at a specific date & time</Text>
              </View>
              <Switch
                value={isScheduled}
                onValueChange={setIsScheduled}
                trackColor={{ false: "#D1D5DB", true: "#A93C40" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isScheduled && (
              <View style={styles.dateTimeRow}>
                <Pressable
                  style={[styles.input, styles.halfInput, { justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ fontSize: 15, color: '#111827' }}>
                    {scheduleDateTime.toLocaleDateString()}
                  </Text>
                </Pressable>
                
                <Pressable
                  style={[styles.input, styles.halfInput, { justifyContent: 'center' }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ fontSize: 15, color: '#111827' }}>
                    {scheduleDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={scheduleDateTime}
                mode="date"
                is24Hour={true}
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selectedDate) setScheduleDateTime(selectedDate);
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                testID="timePicker"
                value={scheduleDateTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowTimePicker(false);
                  if (selectedDate) setScheduleDateTime(selectedDate);
                }}
              />
            )}
          </ScrollView>

          {/* Send button */}
          <Pressable style={styles.sendBtn} onPress={handleSend} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name={isScheduled ? "alarm.fill" : "paperplane.fill"} size={18} color="#FFFFFF" />
                <Text style={styles.sendBtnText}>{isScheduled ? "Schedule Reminder" : "Send Now"}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    maxHeight: "88%",
  },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginTop: 12, marginBottom: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerSub:   { fontSize: 13, color: "#6B7280", marginTop: 2 },
  closeBtn:    { padding: 8, backgroundColor: "#F3F4F6", borderRadius: 20 },
  body:        { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12, gap: 12 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#374151", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  quickPill: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#F0F4F8", borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  quickPillText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: "#111827", backgroundColor: "#FAFAFA",
  },
  textArea: { minHeight: 96, paddingTop: 12 },
  scheduleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  scheduleDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  dateTimeRow: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    marginHorizontal: 24, marginTop: 16,
    backgroundColor: "#A93C40", borderRadius: 18,
    paddingVertical: 16,
    shadowColor: "#A93C40", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  sendBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
});
