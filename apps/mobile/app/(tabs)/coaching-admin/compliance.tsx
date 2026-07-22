import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import SendNotificationModal from "../../../components/features/notifications/SendNotificationModal";
import Animated, { FadeInDown } from "react-native-reanimated";

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
    const adminSessions = parseInt(f.admin_sessions_completed || 0);
    const totalSessions = sessions + adminSessions;
    if (filterType === "All") return true;
    if (filterType === "Non-Compliant") return totalSessions === 0;
    if (filterType === "At Risk") return sessions > 0 && sessions < 3;
    if (filterType === "Compliant") return sessions >= 3 && adminSessions >= 1;
    return true;
  });

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
            renderItem={({ item, index }) => {
              const sessions = parseInt(item.completed_sessions || 0);
              const adminSessions = parseInt(item.admin_sessions_completed || 0);
              
              const coachProgressPct = Math.min((sessions / 3) * 100, 100);
              const adminProgressPct = Math.min((adminSessions / 1) * 100, 100);
              
              const isCoachCompliant = sessions >= 3;
              const isAdminCompliant = adminSessions >= 1;
              
              return (
                <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarWrapper}>
                      <Image 
                        source={{ uri: item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name)}&background=1A2B4A&color=fff` }} 
                        style={styles.avatar} 
                      />
                      {(isCoachCompliant && isAdminCompliant) && (
                        <View style={styles.verifiedBadge}>
                          <IconSymbol name="checkmark.seal.fill" size={14} color="#10B981" />
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.name}>{item.full_name}</Text>
                      <View style={styles.coachRow}>
                        <IconSymbol name="person.2.fill" size={12} color="#6B7280" />
                        <Text style={styles.sub}>{item.coach_name || "Unassigned"}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setNotifyTarget({ id: item.id, name: item.full_name })}>
                      <IconSymbol name="bell.badge.fill" size={16} color="#FFFFFF" />
                      <Text style={styles.actionText}>Nudge</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.progressSection}>
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Peer Coach</Text>
                        <Text style={styles.progressValue}>{sessions}/3</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${coachProgressPct}%`, backgroundColor: sessions === 0 ? '#EF4444' : sessions < 3 ? '#F59E0B' : '#10B981' }]} />
                      </View>
                    </View>
                    
                    <View style={styles.progressItem}>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>Senior Coach</Text>
                        <Text style={styles.progressValue}>{adminSessions}/1</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${adminProgressPct}%`, backgroundColor: adminSessions === 0 ? '#EF4444' : '#10B981' }]} />
                      </View>
                    </View>
                  </View>
                </Animated.View>
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
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1A2B4A" },
  placeholder: { width: 44 },
  
  listContent: { padding: 20, gap: 16 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatarWrapper: { position: "relative", marginRight: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#F3F4F6" },
  verifiedBadge: { position: "absolute", bottom: -2, right: -2, backgroundColor: "#FFFFFF", borderRadius: 10, padding: 2 },
  cardInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 4 },
  coachRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sub: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  
  progressSection: { gap: 12 },
  progressItem: { flex: 1 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  progressValue: { fontSize: 13, fontWeight: "700", color: "#1A2B4A" },
  progressBarBg: { height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  
  filterContainer: { paddingVertical: 12, backgroundColor: "#F9FAFB" },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: "#E5E7EB" },
  filterPillActive: { backgroundColor: "#1A2B4A", borderColor: "#1A2B4A" },
  filterText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  filterTextActive: { color: "#FFFFFF" },
  
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A2B4A", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  actionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  
  emptyBox: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { color: "#9BA3AE", fontSize: 15, fontWeight: "600" },
});
