import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { router } from "expo-router";
import SessionDetailModal from "../../components/features/sessions/SessionDetailModal";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function CoachingScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const user = session?.user;
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [coachesRes, sessionsRes] = await Promise.all([
          fetch(`${API_URL}/support/coaches/assigned`, { headers }),
          fetch(`${API_URL}/support/sessions`, { headers }),
        ]);

        if (coachesRes.ok) setCoaches(await coachesRes.json());
        if (sessionsRes.ok) setSessions(await sessionsRes.json());
      } catch (err) {
        console.error("Failed to fetch coaching data", err);
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchData();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f1a17" />
      </View>
    );
  }

  const assignedCoach = coaches[0];
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const targetSessions = 3;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Peer Coaching</Text>
        <Text style={styles.subHeader}>
          Your mandatory coaching program. Complete 3 sessions in your first semester.
        </Text>
      </View>

      {assignedCoach ? (
        <View style={styles.coachCard}>
          <View style={styles.coachHeader}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{assignedCoach.coach_name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachRole}>YOUR ASSIGNED COACH</Text>
              <Text style={styles.coachName}>{assignedCoach.coach_name}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <IconSymbol name="envelope.fill" size={20} color="#1A2B4A" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressText}>Term Progress</Text>
              <Text style={styles.progressCount}>{completedSessions} / {targetSessions}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (completedSessions / targetSessions) * 100)}%` }]} />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={() => router.push(`/support/schedule-session?userId=${assignedCoach.peer_coach_id}&name=${encodeURIComponent(assignedCoach.coach_name)}` as any)}
          >
            <IconSymbol name="calendar" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Book a Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBg}>
            <IconSymbol name="person.2.fill" size={28} color="#9BA3AE" />
          </View>
          <Text style={styles.emptyTitle}>Pending Assignment</Text>
          <Text style={styles.emptyText}>You haven't been assigned a peer coach yet. Check back soon.</Text>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
      </View>
      
      <View style={styles.sessionsList}>
        {sessions.filter(s => s.status === 'scheduled').length > 0 ? (
          sessions.filter(s => s.status === 'scheduled').map((session) => (
            <TouchableOpacity key={session.id} style={styles.sessionCard} onPress={() => setSelectedSession(session)}>
              <View style={styles.sessionDateBadge}>
                <Text style={styles.sessionDateBadgeMonth}>
                  {new Date(session.scheduled_at).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                </Text>
                <Text style={styles.sessionDateBadgeDay}>
                  {new Date(session.scheduled_at).getDate()}
                </Text>
              </View>
              <View style={styles.sessionInfo}>
                {session.title ? (
                  <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6, color: '#111827' }}>{session.title}</Text>
                ) : null}
                <Text style={styles.sessionTime}>
                  <IconSymbol name="calendar" size={14} color="#6B7280" /> {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.sessionLocation}>
                  <IconSymbol name="mappin.and.ellipse" size={14} color="#6B7280" /> {session.location || "Location TBD"}
                </Text>
                <View style={styles.statusChip}>
                  <Text style={styles.sessionStatus}>SCHEDULED</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noSessionsBox}>
            <IconSymbol name="calendar" size={24} color="#9BA3AE" />
            <Text style={styles.noSessionsText}>No upcoming sessions.</Text>
          </View>
        )}
      </View>
      
      <SessionDetailModal
        session={selectedSession}
        visible={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onRefresh={() => {
          if (token) {
            fetch(`${API_URL}/support/sessions`, { headers: { Authorization: `Bearer ${token}` } })
              .then(res => res.json())
              .then(data => setSessions(data))
              .catch(err => console.error(err));
          }
        }}
        currentUserId={session?.user?.id}
        accessToken={session?.accessToken}
        currentUserRoles={session?.user?.roles}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  
  headerContainer: { marginBottom: 24 },
  header: { fontSize: 32, fontWeight: "900", color: "#1A2B4A", letterSpacing: -0.5 },
  subHeader: { fontSize: 16, color: "#6B7280", marginTop: 8, lineHeight: 24 },
  
  sectionHeaderRow: { marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4A" },
  
  coachCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
    gap: 24,
  },
  coachHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#A93C40",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  coachRole: { fontSize: 12, color: "#6B7280", fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 },
  coachName: { fontSize: 20, fontWeight: "800", color: "#1A2B4A" },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0F2F5",
    alignItems: "center", justifyContent: "center",
  },
  
  progressContainer: { gap: 10 },
  progressHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  progressText: { fontSize: 15, fontWeight: "700", color: "#1A2B4A" },
  progressCount: { fontSize: 15, fontWeight: "800", color: "#A93C40" },
  progressBar: { height: 12, backgroundColor: "#F0F2F5", borderRadius: 6, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#A93C40", borderRadius: 6 },
  
  primaryButton: {
    backgroundColor: "#1A2B4A",
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  
  emptyCard: {
    padding: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    alignItems: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
    gap: 12,
  },
  emptyIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F0F2F5", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1A2B4A" },
  emptyText: { color: "#6B7280", fontSize: 15, textAlign: "center", lineHeight: 22 },
  
  sessionsList: { gap: 16 },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    gap: 20,
  },
  sessionDateBadge: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 72,
  },
  sessionDateBadgeMonth: { fontSize: 13, fontWeight: "800", color: "#A93C40", marginBottom: 2 },
  sessionDateBadgeDay: { fontSize: 24, fontWeight: "900", color: "#1A2B4A" },
  sessionInfo: { flex: 1, gap: 8, alignItems: "flex-start" },
  sessionTime: { fontSize: 15, fontWeight: "700", color: "#1A2B4A" },
  sessionLocation: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  statusChip: {
    backgroundColor: "#25D36615",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  sessionStatus: { fontSize: 11, fontWeight: "800", color: "#25D366", letterSpacing: 0.5 },
  
  noSessionsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    backgroundColor: "transparent",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F0F2F5",
    borderStyle: "dashed",
  },
  noSessionsText: { color: "#9BA3AE", fontSize: 15, fontWeight: "600" },
});
