import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function CoachingAdminDashboard() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/support/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  const stats = data?.stats || { assigned_freshers: 0, total_freshers: 0, active_coaches: 0, completed_mandatory_sessions: 0, target_mandatory_sessions: 0, target_freshers_per_coach: 0 };
  const needsAttention = data?.needsAttention || [];
  
  const completionRate = stats.target_mandatory_sessions > 0 
    ? (stats.completed_mandatory_sessions / stats.target_mandatory_sessions) * 100 
    : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.greeting}>Senior Mental Wellness Coach</Text>
        <Text style={styles.header}>Quick Overview</Text>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A2B4A" />}
      >
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/coaching-admin/assignments")}>
            <View style={[styles.actionIconBg, { backgroundColor: "#1A2B4A" }]}>
              <IconSymbol name="plus" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Assign Fresher</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/coaching-admin/announcements")}>
            <View style={[styles.actionIconBg, { backgroundColor: "#C9933A" }]}>
              <IconSymbol name="megaphone.fill" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Make Announcement</Text>
          </TouchableOpacity>
        </View>

        {/* Top Level Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push("/(tabs)/coaching-admin/freshers")}>
            <Text style={styles.statValue}>{stats.assigned_freshers} <Text style={{ fontSize: 20, color: '#9CA3AF' }}>/ {stats.total_freshers}</Text></Text>
            <Text style={styles.statLabel}>Freshers Assigned</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push("/(tabs)/coaching-admin/peer-coaches")}>
            <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start"}}>
              <Text style={styles.statValue}>{stats.active_coaches}</Text>
              {stats.target_freshers_per_coach > 0 && (
                <View style={{backgroundColor: "#F3F4F6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                  <Text style={{fontSize: 10, color: "#6B7280", fontWeight: "700"}}>MAX {stats.target_freshers_per_coach}/COACH</Text>
                </View>
              )}
            </View>
            <Text style={styles.statLabel}>Active Coaches</Text>
          </TouchableOpacity>
        </View>

        {/* Session Summary Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statBox, { borderLeftWidth: 4, borderLeftColor: "#3B82F6" }]} 
            onPress={() => router.push({ pathname: "/(tabs)/schedule", params: { filter: "upcoming" } } as any)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                <IconSymbol name="clock.fill" size={18} color="#3B82F6" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.upcoming_sessions_count ?? 0}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statBox, { borderLeftWidth: 4, borderLeftColor: "#EF4444" }]} 
            onPress={() => router.push({ pathname: "/(tabs)/schedule", params: { filter: "overdue" } } as any)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
                <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#EF4444" />
              </View>
            </View>
            <Text style={[styles.statValue, { color: stats.overdue_sessions_count > 0 ? "#EF4444" : "#111827" }]}>{stats.overdue_sessions_count ?? 0}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Progress Card */}
        <TouchableOpacity style={styles.progressCard} onPress={() => router.push("/(tabs)/coaching-admin/compliance")} activeOpacity={0.9}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Session Compliance</Text>
              <Text style={styles.progressSubtitle}>Mandatory completion rate</Text>
            </View>
            <View style={styles.progressRatioBadge}>
              <Text style={styles.progressRatio}>{stats.completed_mandatory_sessions} <Text style={{fontSize: 16, color: 'rgba(255,255,255,0.7)'}}>/ {stats.target_mandatory_sessions}</Text></Text>
            </View>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, completionRate)}%` }]} />
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
            <Text style={{color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600"}}>0%</Text>
            <Text style={{color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "800"}}>{completionRate.toFixed(0)}%</Text>
          </View>
        </TouchableOpacity>

        {/* Dashboard Grid Navigation */}
        <View style={styles.navGrid}>
          {[
            { label: 'Sessions', icon: 'calendar', route: '/(tabs)/coaching-admin/sessions', color: '#4D96FF' },
            { label: 'Reports', icon: 'doc.text.fill', route: '/(tabs)/coaching-admin/reports', color: '#FF6B6B' },
            { label: 'Compliance', icon: 'shield.fill', route: '/(tabs)/coaching-admin/compliance', color: '#10B981' },
            { label: 'My Bookings', icon: 'person.fill', route: '/(tabs)/coaching-admin/my-bookings', color: '#8B5CF6' },
          ].map((item) => (
            <TouchableOpacity 
              key={item.label} 
              style={styles.navCard} 
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.navIcon, { backgroundColor: `${item.color}15` }]}>
                <IconSymbol name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Needs Attention */}
        <View style={styles.attentionSection}>
          <View style={styles.attentionHeader}>
            <Text style={styles.attentionTitle}>Needs Attention</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/coaching-admin/compliance")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {needsAttention.length > 0 ? (
            needsAttention.map((item: any, index: number) => (
              <View key={`${item.id}-${index}`} style={styles.attentionItem}>
                <View style={styles.attentionIcon}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FF6B6B" />
                </View>
                <View style={styles.attentionInfo}>
                  <Text style={styles.attentionName}>{item.full_name}</Text>
                  <Text style={styles.attentionSub}>Coach: {item.coach_name}</Text>
                </View>
                <TouchableOpacity style={styles.followUpBtn}>
                  <Text style={styles.followUpBtnText}>Nudge</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyAttention}>
              <IconSymbol name="checkmark.seal.fill" size={32} color="#10B981" />
              <Text style={styles.emptyAttentionText}>Everyone is on track!</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FB" },
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  headerContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 }, android: { elevation: 4 } }), zIndex: 10 },
  greeting: { fontSize: 13, fontWeight: "800", color: "#8B5CF6", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  header: { fontSize: 34, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 150, paddingTop: 32 },
  
  quickActions: { flexDirection: "row", gap: 16 },
  actionBtn: { flex: 1, backgroundColor: "#FFFFFF", padding: 16, borderRadius: 24, flexDirection: "column", alignItems: "flex-start", gap: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  actionIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: 15, fontWeight: "800", color: "#111827" },
  
  statsRow: { flexDirection: "row", gap: 16 },
  statBox: { flex: 1, backgroundColor: "#FFFFFF", padding: 20, borderRadius: 24, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  statValue: { fontSize: 34, fontWeight: "900", color: "#111827", marginBottom: 6, letterSpacing: -1 },
  statLabel: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  
  progressCard: { backgroundColor: "#0F172A", padding: 24, borderRadius: 28, ...Platform.select({ ios: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24 }, android: { elevation: 8 } }) },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  progressTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  progressSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  progressRatioBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  progressRatio: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 },
  progressBarBg: { height: 10, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 5, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#10B981", borderRadius: 5 },
  
  navGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  navCard: { width: "47%", backgroundColor: "#FFFFFF", padding: 20, borderRadius: 24, alignItems: "flex-start", gap: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  navIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 15, fontWeight: "800", color: "#111827" },
  
  attentionSection: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  attentionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  attentionTitle: { fontSize: 19, fontWeight: "900", color: "#111827" },
  seeAllText: { fontSize: 14, fontWeight: "800", color: "#8B5CF6" },
  
  attentionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  attentionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center", marginRight: 14 },
  attentionInfo: { flex: 1 },
  attentionName: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 4 },
  attentionSub: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  followUpBtn: { backgroundColor: "#F3F4F6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  followUpBtnText: { fontSize: 13, fontWeight: "800", color: "#4B5563" },
  
  emptyAttention: { alignItems: "center", paddingVertical: 40, gap: 16 },
  emptyAttentionText: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },
});
