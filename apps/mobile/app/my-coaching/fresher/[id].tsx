import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Platform, RefreshControl, Image, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";

export default function FresherDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [fresher, setFresher] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchDetails = async () => {
    if (!session?.accessToken || !id) return;
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [freshersRes, sessionsRes] = await Promise.all([
        apiRequest<any[]>("/support/coaches/freshers", { headers }).catch(() => []),
        apiRequest<any[]>("/support/sessions", { headers }).catch(() => []),
      ]);

      const foundFresher = (freshersRes || []).find(f => f.fresher_id === id);
      setFresher(foundFresher || null);
      
      const fSessions = (sessionsRes || []).filter(s => s.student_id === id && s.type === 'peer_coaching');
      setSessions(fSessions);
    } catch (err) {
      console.error("Error fetching fresher details", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, session?.accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  if (!fresher) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Fresher not found or not assigned to you.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedCount = sessions.filter(s => s.status === 'completed').length;
  // Determine if a mandatory session is due soon (e.g., if completed < 3)
  const isOverdue = completedCount === 0;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.headerContainer}>
        <SafeAreaView edges={["top"]} style={{ paddingBottom: 0 }} />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fresher Profile</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A2B4A" />}
      >
        <View style={styles.profileCard}>
          {fresher.avatar_url ? (
            <Image source={{ uri: fresher.avatar_url }} style={styles.largeAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{fresher.fresher_name?.charAt(0) || "F"}</Text>
            </View>
          )}
          <Text style={styles.fresherName}>{fresher.fresher_name}</Text>
          <Text style={styles.fresherDetail}>{fresher.email}</Text>
          
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={() => handleWhatsApp(fresher.phone)}>
              <FontAwesome name="whatsapp" size={22} color="#25D366" />
              <Text style={styles.socialBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialBtn, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]} 
              onPress={() => router.push(`/my-coaching/book?studentId=${fresher.fresher_id}&name=${encodeURIComponent(fresher.fresher_name)}` as any)}
            >
              <Ionicons name="calendar" size={20} color="#4B5563" />
              <Text style={[styles.socialBtnText, { color: '#4B5563' }]}>Book Session</Text>
            </TouchableOpacity>
          </View>

          {isOverdue && (
            <View style={styles.reminderBox}>
              <Ionicons name="alert-circle" size={20} color="#B91C1C" />
              <Text style={styles.reminderText}>This fresher is overdue for a session. Please reach out to schedule one soon.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Session History</Text>
        </View>

        <View style={styles.historyList}>
          {sessions.length > 0 ? (
            sessions.map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionTop}>
                  <View style={styles.sessionDateBox}>
                    <Text style={styles.sessionMonth}>{new Date(session.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                    <Text style={styles.sessionDay}>{new Date(session.date).getDate()}</Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionLocation}>{session.location || 'Location TBD'}</Text>
                    <Text style={styles.sessionStatus}>Status: <Text style={{ textTransform: 'capitalize' }}>{session.status}</Text></Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    session.status === 'completed' ? styles.statusBadgeCompleted : 
                    session.status === 'cancelled' ? styles.statusBadgeCancelled : null
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      session.status === 'completed' ? styles.statusTextCompleted : 
                      session.status === 'cancelled' ? styles.statusTextCancelled : null
                    ]}>
                      {session.status}
                    </Text>
                  </View>
                </View>
                
                {session.status === 'completed' && !session.has_report && (
                  <TouchableOpacity 
                    style={styles.reportBtn}
                    onPress={() => router.push(`/my-coaching/report?sessionId=${session.id}` as any)}
                  >
                    <Ionicons name="document-text" size={16} color="#FFFFFF" />
                    <Text style={styles.reportBtnText}>Submit Report</Text>
                  </TouchableOpacity>
                )}
                {session.status === 'completed' && session.has_report && (
                  <View style={styles.reportSubmitted}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.reportSubmittedText}>Report Submitted</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardDesc}>No sessions recorded yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FB" },
  errorText: { fontSize: 16, color: "#6B7280", marginBottom: 20 },
  backBtn: { backgroundColor: "#1A2B4A", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: "#FFFFFF", fontWeight: "700" },
  
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
  
  scrollContent: { padding: 20, gap: 24, paddingBottom: 100 },
  
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 }
    }),
  },
  largeAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#4338CA' },
  fresherName: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 4 },
  fresherDetail: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  
  contactRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
  socialBtn: { 
    flex: 1, 
    height: 48, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    backgroundColor: '#E8FBF0',
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  socialBtnText: { color: '#166534', fontWeight: '800', fontSize: 15 },
  
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    width: '100%'
  },
  reminderText: { color: '#991B1B', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  
  historyList: { gap: 16 },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sessionDateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sessionMonth: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  sessionDay: { fontSize: 20, fontWeight: '900', color: '#111827' },
  sessionInfo: { flex: 1 },
  sessionLocation: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sessionStatus: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  
  statusBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeCompleted: { backgroundColor: '#ECFDF5' },
  statusBadgeCancelled: { backgroundColor: '#FEF2F2' },
  statusBadgeText: { fontSize: 12, fontWeight: '800', color: '#3B82F6' },
  statusTextCompleted: { color: '#10B981' },
  statusTextCancelled: { color: '#EF4444' },

  reportBtn: {
    marginTop: 16,
    backgroundColor: '#1A2B4A',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  reportBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  
  reportSubmitted: {
    marginTop: 16,
    backgroundColor: '#ECFDF5',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  reportSubmittedText: { color: '#059669', fontWeight: '700', fontSize: 14 },

  emptyCard: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F3F4F6",
    borderStyle: "dashed",
    borderRadius: 20
  },
  emptyCardDesc: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 },
});
