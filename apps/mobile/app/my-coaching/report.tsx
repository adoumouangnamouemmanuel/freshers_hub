import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";

export default function SubmitReportScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [topics, setTopics] = useState("");
  const [wellbeing, setWellbeing] = useState("");
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!topics.trim() || !wellbeing.trim()) {
      Alert.alert("Missing Fields", "Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      const content = {
        topicsDiscussed: topics,
        generalWellbeing: wellbeing,
        needsFollowUp
      };

      await apiRequest(`/support/sessions/${sessionId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ content }),
      });

      Alert.alert("Success", "Report submitted successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.headerContainer}>
        <SafeAreaView edges={["top"]} style={{ paddingBottom: 0 }} />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session Report</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.guidanceBox}>
            <Ionicons name="information-circle" size={24} color="#059669" />
            <Text style={styles.guidanceText}>
              This report is confidential and goes directly to Coach Yvonne. Use it to document key discussion points and flag if the fresher needs additional support.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Topics Discussed <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Time management, navigating campus..."
              placeholderTextColor="#9CA3AF"
              value={topics}
              onChangeText={setTopics}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>General Wellbeing Notes <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              placeholder="How is the student settling in? Any concerns?"
              placeholderTextColor="#9CA3AF"
              value={wellbeing}
              onChangeText={setWellbeing}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity 
              style={[styles.checkboxContainer, needsFollowUp && styles.checkboxContainerActive]}
              onPress={() => setNeedsFollowUp(!needsFollowUp)}
            >
              <View style={[styles.checkbox, needsFollowUp && styles.checkboxActive]}>
                {needsFollowUp && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxLabel, needsFollowUp && styles.checkboxLabelActive]}>Flag for Follow-up</Text>
                <Text style={styles.checkboxDesc}>Check this if Coach Yvonne or a counsellor should reach out to the student.</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.footer}>
        <SafeAreaView edges={["bottom"]} style={{ paddingBottom: 0 }} />
        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Confidential Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 }
    }),
    zIndex: 10,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  
  scrollContent: { padding: 24, gap: 24, paddingBottom: 40 },
  
  guidanceBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 12,
  },
  guidanceText: { flex: 1, fontSize: 14, color: '#065F46', lineHeight: 20, fontWeight: '500' },

  formGroup: { gap: 8 },
  label: { fontSize: 15, fontWeight: '700', color: '#111827', marginLeft: 4 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: { height: 100, paddingTop: 16 },
  textAreaLarge: { height: 140, paddingTop: 16 },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12
  },
  checkboxContainerActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkboxActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checkboxTextContainer: { flex: 1 },
  checkboxLabel: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  checkboxLabelActive: { color: '#B91C1C' },
  checkboxDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  submitBtn: {
    backgroundColor: '#1A2B4A',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  }
});
