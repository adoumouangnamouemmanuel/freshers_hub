import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Platform, RefreshControl, Image, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";

export default function MyCoachingScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const firstName = session?.user.fullName?.split(" ")[0] ?? "Coach";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [freshers, setFreshers] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);

  const fetchCoachingData = async () => {
    if (!session?.accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [freshersRes, sessionsRes] = await Promise.all([
        apiRequest<any[]>("/support/coaches/freshers", { headers }).catch(() => []),
        apiRequest<any[]>("/support/sessions", { headers }).catch(() => []),
      ]);

      setFreshers(freshersRes || []);
      setAllSessions(sessionsRes || []);
    } catch (err) {
      console.error("Error fetching coaching data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoachingData();
  }, [session?.accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoachingData();
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

  // Calculate stats for freshers
  const freshersWithStats = freshers.map(f => {
    const fSessions = allSessions.filter(s => s.student_id === f.fresher_id && s.type === 'peer_coaching');
    const completed = fSessions.filter(s => s.status === 'completed').length;
    // Assume 3 mandatory sessions if not dynamically provided
    const totalMandatory = fSessions.filter(s => s.is_mandatory).length || 3;
    return {
      ...f,
      sessions: fSessions,
      completed,
      totalMandatory,
      onTrack: completed >= 1 // Arbitrary definition of 'on track' for now
    };
  });

  const onTrackCount = freshersWithStats.filter(f => f.onTrack).length;
  
  // My sessions with Coach Yvonne (Yvonne ID is 44444444-4444-4444-4444-444444444444 in seed)
  const mySessionsWithYvonne = allSessions.filter(s => s.student_id === session?.user.id && s.provider_id === '44444444-4444-4444-4444-444444444444');
  const upcomingYvonneSession = mySessionsWithYvonne.find(s => s.status === 'scheduled');

  return (
    <View style={styles.screen}>
      <View style={styles.headerContainer}>
        <SafeAreaView edges={["top"]} style={{ paddingBottom: 0 }} />
        <Text style={styles.greeting}>Peer Coach Hub</Text>
        <Text style={styles.header}>Coaching</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A2B4A" />}
      >
        
        {/* Overview Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{freshers.length}</Text>
            <Text style={styles.statLabel}>Assigned Freshers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: onTrackCount === freshers.length && freshers.length > 0 ? "#059669" : "#D97706" }]}>
              {onTrackCount}
            </Text>
            <Text style={styles.statLabel}>On Track</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Freshers</Text>
        </View>

        <View style={styles.listSection}>
          {freshersWithStats.map(fresher => {
            const isBehind = fresher.completed === 0;
            return (
              <TouchableOpacity 
                key={fresher.id} 
                style={[styles.fresherCard, isBehind && styles.fresherCardBehind]}
                activeOpacity={0.7}
                onPress={() => router.push(`/user/${fresher.fresher_id}` as any)}
              >
                {isBehind && (
                  <View style={styles.alertBadge}>
                    <Ionicons name="alert-circle" size={12} color="#DC2626" />
                    <Text style={styles.alertText}>Needs Session</Text>
                  </View>
                )}
                <View style={styles.fresherHeader}>
                  {fresher.avatar_url ? (
                    <Image source={{ uri: fresher.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{fresher.fresher_name?.charAt(0) || "F"}</Text>
                    </View>
                  )}
                  <View style={styles.fresherInfo}>
                    <Text style={styles.fresherName}>{fresher.fresher_name}</Text>
                    <Text style={styles.fresherDetail}>Class of {fresher.class_year || '2028'}</Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>Progress: {fresher.completed} of {fresher.totalMandatory} sessions</Text>
                  <View style={styles.miniProgressBar}>
                    <View style={[styles.miniProgressFill, { width: `${Math.min((fresher.completed / Math.max(fresher.totalMandatory, 1)) * 100, 100)}%` }]} />
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => handleWhatsApp(fresher.phone)}>
                    <FontAwesome name="whatsapp" size={18} color="#25D366" />
                    <Text style={styles.btnSecondaryText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnPrimary} 
                    onPress={() => router.push(`/support/schedule-session?userId=${fresher.fresher_id}&name=${encodeURIComponent(fresher.fresher_name)}&asCoach=true` as any)}
                  >
                    <Text style={styles.btnPrimaryText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )
          })}
          
          {freshers.length === 0 && (
             <View style={styles.emptyCard}>
               <Text style={styles.emptyCardDesc}>No freshers assigned to you yet.</Text>
             </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Check-ins</Text>
        </View>
        <Text style={styles.sectionDesc}>Your sessions with Coach Yvonne</Text>

        <View style={styles.yvonneCard}>
          <View style={styles.fresherHeader}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: "#FCE7F3" }]}>
              <Text style={[styles.avatarText, { color: "#DB2777" }]}>Y</Text>
            </View>
            <View style={styles.fresherInfo}>
              <Text style={styles.fresherName}>Coach Yvonne</Text>
              <Text style={styles.fresherDetail}>Head Coach</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleWhatsApp("+233200000004")}>
               <FontAwesome name="whatsapp" size={24} color="#25D366" />
            </TouchableOpacity>
          </View>
          
          {upcomingYvonneSession ? (
            <View style={styles.upcomingBox}>
              <Ionicons name="calendar" size={16} color="#1A2B4A" />
              <Text style={styles.upcomingText}>Next: {new Date(upcomingYvonneSession.date).toLocaleDateString()}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.btnSecondary, { marginTop: 12, justifyContent: 'center' }]} 
              onPress={() => router.push(`/support/schedule-session?userId=44444444-4444-4444-4444-444444444444&name=${encodeURIComponent('Yvonne Ansah')}` as any)}
            >
              <Text style={styles.btnSecondaryText}>Schedule a Check-in</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* Floating Action Button for View Sessions */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push("/support/sessions" as any)}
      >
        <Ionicons name="list" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>View Sessions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FB" },
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 }
    }),
    zIndex: 10,
  },
  greeting: { fontSize: 13, fontWeight: "800", color: "#8B5CF6", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  header: { fontSize: 34, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 100, paddingTop: 24 },
  
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 }
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A2B4A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  sectionDesc: { fontSize: 15, color: "#6B7280", marginTop: -16, marginBottom: 8 },
  
  listSection: { gap: 16 },
  
  fresherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 3 }
    }),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
    position: 'relative'
  },
  fresherCardBehind: {
    borderColor: '#FECACA',
    borderWidth: 2,
  },
  alertBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  alertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  fresherHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: '#E0E7FF' },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#4338CA" },
  fresherInfo: { flex: 1 },
  fresherName: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 2 },
  fresherDetail: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  miniProgressBar: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  btnSecondary: { flex: 1, backgroundColor: '#F3F4F6', height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSecondaryText: { color: '#4B5563', fontWeight: '700', fontSize: 14 },
  btnPrimary: { flex: 1, backgroundColor: '#1A2B4A', height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  yvonneCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8FBF0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  upcomingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 12
  },
  upcomingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B4A'
  },
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
  
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#1A2B4A",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 6 }
    }),
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  }
});
