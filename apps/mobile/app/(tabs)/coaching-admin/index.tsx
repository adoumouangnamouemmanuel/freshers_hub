import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function CoachingAdminDashboard() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = session?.user?.fullName?.split(" ")[0] ?? "Admin";
  
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
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const stats = data?.stats || { assigned_freshers: 0, total_freshers: 0, active_coaches: 0, completed_mandatory_sessions: 0, target_mandatory_sessions: 0, target_freshers_per_coach: 0 };
  const needsAttention = data?.needsAttention || [];
  
  const completionRate = stats.target_mandatory_sessions > 0 
    ? (stats.completed_mandatory_sessions / stats.target_mandatory_sessions) * 100 
    : 0;

  return (
    <View style={styles.screen}>
      {/* Premium Header Overlay */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.headerBg, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Senior Coach</Text>
            <Text style={styles.headerName}>Hi, {firstName} 👋</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        
        {/* Primary Action Overlay */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.primaryActionWrapper}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() =>
              router.push(
                `/support/schedule-session?asCoach=true` as any
              )
            }
          >
            <View style={styles.primaryActionIcon}>
              <Ionicons name="calendar" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryActionTitle}>Book a Session</Text>
              <Text style={styles.primaryActionSub}>Schedule with a fresher</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions row */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/coaching-admin/assignments")}>
            <View style={[styles.actionIconBg, { backgroundColor: "#8B5CF6" }]}>
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Assign Fresher</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/coaching-admin/announcements")}>
            <View style={[styles.actionIconBg, { backgroundColor: "#C9933A" }]}>
              <Ionicons name="megaphone" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Announcement</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Top Level Stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
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
        </Animated.View>

        {/* Session Summary Row */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
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
        </Animated.View>

        {/* Premium Progress Card */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
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
        </Animated.View>

        {/* Dashboard Grid Navigation */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.navGrid}>
            {[
              { label: 'Sessions', icon: 'calendar-outline', route: '/(tabs)/coaching-admin/sessions', color: '#4D96FF', bg: '#EFF6FF' },
              { label: 'Reports', icon: 'document-text-outline', route: '/(tabs)/coaching-admin/reports', color: '#FF6B6B', bg: '#FEF2F2' },
              { label: 'Compliance', icon: 'shield-checkmark-outline', route: '/(tabs)/coaching-admin/compliance', color: '#10B981', bg: '#ECFDF5' },
              { label: 'My Bookings', icon: 'bookmark-outline', route: '/(tabs)/coaching-admin/my-bookings', color: '#8B5CF6', bg: '#F5F3FF' },
            ].map((item) => (
              <TouchableOpacity 
                key={item.label} 
                style={styles.navCard} 
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.navIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.navLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Needs Attention */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
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
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  headerBg: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 16,
    paddingTop: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 },
    }),
    zIndex: 10,
  },
  headerRow: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 13, fontWeight: "800", color: "#4F46E5", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  headerName: { fontSize: 34, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingTop: 28 },
  
  primaryActionWrapper: {
    marginBottom: 8,
  },
  primaryAction: {
    backgroundColor: "#1A2B4A",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryActionIcon: {
    width: 48, height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    marginRight: 16,
  },
  primaryActionTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  primaryActionSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },

  quickActions: { flexDirection: "row", gap: 16 },
  actionBtn: { flex: 1, backgroundColor: "#FFFFFF", padding: 16, borderRadius: 24, flexDirection: "column", alignItems: "flex-start", gap: 16, ...Platform.select({ ios: { shadowColor: "#1A2B4A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  actionIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: 15, fontWeight: "800", color: "#111827" },
  
  statsRow: { flexDirection: "row", gap: 16 },
  statBox: { flex: 1, backgroundColor: "#FFFFFF", padding: 20, borderRadius: 24, ...Platform.select({ ios: { shadowColor: "#1A2B4A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
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
  navCard: { width: "47%", backgroundColor: "#FFFFFF", padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: "center", justifyContent: 'space-between', gap: 12, ...Platform.select({ ios: { shadowColor: "#1A2B4A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  navIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 14, fontWeight: "800", color: "#111827", flex: 1 },
  
  attentionSection: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, ...Platform.select({ ios: { shadowColor: "#1A2B4A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 }, android: { elevation: 3 } }), borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
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
