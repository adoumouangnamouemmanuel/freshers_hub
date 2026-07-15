import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function SessionsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_URL}/support/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Mock data or actual data based on API routing
        // For MVP, if API fails, fallback to empty
        if (res.ok) setSessions(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchSessions();
  }, [token]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Unit Sessions</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A2B4A" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={s => s.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyBox}>
              <IconSymbol name="calendar" size={32} color="#9BA3AE" />
              <Text style={styles.emptyText}>No sessions found.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.dateText}>{new Date(item.scheduled_at).toLocaleDateString()}</Text>
                <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusComplete : styles.statusPending]}>
                  <Text style={[styles.statusText, item.status === 'completed' && styles.statusTextComplete]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.namesText}>{item.student_name} w/ {item.provider_name}</Text>
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4A" },
  placeholder: { width: 40 },
  
  listContent: { padding: 20, gap: 12 },
  sessionCard: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  dateText: { fontSize: 14, fontWeight: "700", color: "#A93C40" },
  namesText: { fontSize: 16, fontWeight: "700", color: "#1A2B4A", marginBottom: 4 },
  locationText: { fontSize: 13, color: "#6B7280" },
  
  statusBadge: { backgroundColor: "#F0F2F5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusComplete: { backgroundColor: "#10B98115" },
  statusPending: { backgroundColor: "#C9933A15" },
  statusText: { fontSize: 11, fontWeight: "800", color: "#6B7280" },
  statusTextComplete: { color: "#10B981" },
  
  emptyBox: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { color: "#9BA3AE", fontSize: 15, fontWeight: "600" },
});
