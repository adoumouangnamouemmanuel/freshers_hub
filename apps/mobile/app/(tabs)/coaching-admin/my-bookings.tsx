import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function MyBookingsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await fetch(`${API_URL}/support/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter to only sessions where Yvonne is the provider
          const mySessions = data.filter((s: any) => s.provider_id === session?.user?.id);
          setSessions(mySessions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMyBookings();
  }, [token]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
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
              <Text style={styles.emptyText}>You have no upcoming sessions.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{new Date(item.scheduled_at).toLocaleDateString()}</Text>
                <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusComplete : styles.statusPending]}>
                  <Text style={[styles.statusText, item.status === 'completed' && styles.statusTextComplete]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.namesText}>Student: {item.student_name}</Text>
              <Text style={styles.locationText}>{item.location}</Text>
              
              {item.status !== 'completed' && (
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Mark Complete</Text>
                </TouchableOpacity>
              )}
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
  card: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  dateText: { fontSize: 14, fontWeight: "700", color: "#A93C40" },
  namesText: { fontSize: 16, fontWeight: "700", color: "#1A2B4A", marginBottom: 4 },
  locationText: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  
  statusBadge: { backgroundColor: "#F0F2F5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusComplete: { backgroundColor: "#10B98115" },
  statusPending: { backgroundColor: "#C9933A15" },
  statusText: { fontSize: 11, fontWeight: "800", color: "#6B7280" },
  statusTextComplete: { color: "#10B981" },
  
  actionBtn: { backgroundColor: "#1A2B4A", padding: 12, borderRadius: 12, alignItems: "center" },
  actionBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  
  emptyBox: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { color: "#9BA3AE", fontSize: 15, fontWeight: "600" },
});
