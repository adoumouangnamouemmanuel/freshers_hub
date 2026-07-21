import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function CounsellingScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_URL}/support/sessions`, { headers });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.filter((s: any) => s.unit_id === 2)); // Assuming unit_id 2 is Counselling
        }
      } catch (err) {
        console.error("Failed to fetch counselling sessions", err);
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Counselling</Text>
        <Text style={styles.subHeader}>
          Confidential mental health support.
        </Text>
      </View>

      <View style={styles.bookCard}>
        <View style={styles.bookIconBg}>
          <IconSymbol name="cross.case.fill" size={28} color="#C9933A" />
        </View>
        <Text style={styles.bookTitle}>Book a Session</Text>
        <Text style={styles.bookDesc}>
          Schedule a confidential appointment with our professional counselling team. Available in-person or online.
        </Text>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
          <IconSymbol name="calendar" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Schedule Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Your Appointments</Text>
      </View>
      
      <View style={styles.sessionsList}>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
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
                <View style={[styles.statusChip, { backgroundColor: session.status === 'scheduled' ? '#25D36615' : '#F0F2F5' }]}>
                  <Text style={[styles.sessionStatus, { color: session.status === 'scheduled' ? '#25D366' : '#6B7280' }]}>
                    {session.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noSessionsBox}>
            <IconSymbol name="calendar" size={24} color="#9BA3AE" />
            <Text style={styles.noSessionsText}>No upcoming appointments.</Text>
          </View>
        )}
      </View>
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
  
  bookCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
    gap: 12,
    alignItems: "center",
  },
  bookIconBg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#C9933A15",
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  bookTitle: { fontSize: 22, fontWeight: "800", color: "#1A2B4A" },
  bookDesc: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22, marginBottom: 8 },
  
  primaryButton: {
    backgroundColor: "#C9933A",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  
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
  sessionDateBadgeMonth: { fontSize: 13, fontWeight: "800", color: "#C9933A", marginBottom: 2 },
  sessionDateBadgeDay: { fontSize: 24, fontWeight: "900", color: "#1A2B4A" },
  sessionInfo: { flex: 1, gap: 8, alignItems: "flex-start" },
  sessionTime: { fontSize: 15, fontWeight: "700", color: "#1A2B4A" },
  sessionLocation: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  sessionStatus: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  
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
