import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import SendNotificationModal from "../../../components/features/notifications/SendNotificationModal";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function ComplianceScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [freshers, setFreshers] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"All" | "At Risk" | "Non-Compliant" | "Compliant">("All");
  const [notifyTarget, setNotifyTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchFreshers = async () => {
      try {
        const res = await fetch(`${API_URL}/support/admin/freshers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setFreshers(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchFreshers();
  }, [token]);

  const filteredFreshers = freshers.filter(f => {
    const sessions = parseInt(f.completed_sessions || 0);
    if (filterType === "All") return true;
    if (filterType === "Non-Compliant") return sessions === 0;
    if (filterType === "At Risk") return sessions > 0 && sessions < 3;
    if (filterType === "Compliant") return sessions >= 3;
    return true;
  });

  const logFollowUp = async (fresherId: string) => {
    try {
      const res = await fetch(`${API_URL}/support/admin/compliance/followup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fresherId, notes: "Nudged via dashboard" })
      });
      if (res.ok) {
        Alert.alert("Success", "Follow up logged successfully.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compliance</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A2B4A" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {["All", "At Risk", "Non-Compliant", "Compliant"].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.filterPill, filterType === type && styles.filterPillActive]}
                  onPress={() => setFilterType(type as any)}
                >
                  <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={filteredFreshers}
            keyExtractor={f => f.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyBox}>
                <IconSymbol name="checkmark.seal.fill" size={32} color="#10B981" />
                <Text style={styles.emptyText}>No freshers match this filter.</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const sessions = parseInt(item.completed_sessions || 0);
              const progressPct = Math.min((sessions / 3) * 100, 100);
              
              return (
                <View style={styles.card}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.sub}>Coach: {item.coach_name || "None"}</Text>
                    
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: sessions === 0 ? '#EF4444' : sessions < 3 ? '#F59E0B' : '#10B981' }]} />
                      </View>
                      <Text style={styles.progressText}>{sessions} / 3 Sessions</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setNotifyTarget({ id: item.id, name: item.full_name })}>
                    <IconSymbol name="bell.badge.fill" size={14} color="#FFFFFF" />
                    <Text style={styles.actionText}>Notify</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </>
      )}

      {notifyTarget && (
        <SendNotificationModal
          visible={!!notifyTarget}
          onClose={() => setNotifyTarget(null)}
          targetUserId={notifyTarget?.id ?? ""}
          targetUserName={notifyTarget?.name ?? ""}
          accessToken={token || ""}
          defaultCategory="nudge"
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
  card: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, flexDirection: "row", alignItems: "center" },
  cardInfo: { flex: 1, paddingRight: 16 },
  name: { fontSize: 16, fontWeight: "700", color: "#1A2B4A", marginBottom: 2 },
  sub: { fontSize: 13, color: "#6B7280" },
  
  filterContainer: { paddingVertical: 12, backgroundColor: "#F8F9FA" },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#E5E7EB" },
  filterPillActive: { backgroundColor: "#1A2B4A" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  filterTextActive: { color: "#FFFFFF" },

  progressContainer: { marginTop: 12 },
  progressBarBg: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A2B4A", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  actionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  
  emptyBox: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { color: "#9BA3AE", fontSize: 15, fontWeight: "600" },
});
