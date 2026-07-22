import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function counsellingDashboard() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  const firstName = session?.user?.fullName?.split(" ")[0] ?? "counsellor";

  const { data, isLoading: loading, isFetching: refreshing, refetch } = useQuery({
    queryKey: ['counselling-dashboard'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/support/counselling/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch counselling dashboard");
      return res.json();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const onRefresh = () => {
    refetch();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const stats = data?.stats || {
    upcoming_sessions: 0,
    overdue_sessions: 0,
    completed_sessions: 0,
    total_students_seen: 0,
    this_week_sessions: 0,
    today_sessions: 0,
  };
  const upcomingSessions = data?.upcomingSessions || [];
  const recentSessions = data?.recentSessions || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#10B981";
      case "scheduled": return "#4F46E5";
      case "cancelled": return "#EF4444";
      default: return "#6B7280";
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.greeting}>Professional Counsellor</Text>
        <Text style={styles.header}>Hi, {firstName} 👋</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() =>
                router.push(
                  `/support/schedule-session?asCounsellor=true&unitId=2` as any
                )
              }
            >
              <View style={styles.primaryActionIcon}>
                <Ionicons name="calendar" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.primaryActionTitle}>Book a Session</Text>
                <Text style={styles.primaryActionSub}>Schedule with a student</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="today" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statValue}>{stats.today_sessions}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: "#E0E7FF" }]}>
                <Ionicons name="calendar" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.statValue}>{stats.this_week_sessions}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              </View>
              <Text style={styles.statValue}>{stats.completed_sessions}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: "#FCE7F3" }]}>
                <Ionicons name="people" size={20} color="#DB2777" />
              </View>
              <Text style={styles.statValue}>{stats.total_students_seen}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </View>
        </Animated.View>

        {/* Alert: Overdue sessions */}
        {stats.overdue_sessions > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <View style={styles.alertCard}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {stats.overdue_sessions} Overdue Session{stats.overdue_sessions > 1 ? "s" : ""}
                </Text>
                <Text style={styles.alertSub}>Sessions past their scheduled time</Text>
              </View>
              <TouchableOpacity
                style={styles.alertAction}
                onPress={() => router.push("/(tabs)/counselling-dashboard/my-bookings" as any)}
              >
                <Text style={styles.alertActionText}>View</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Navigation Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.navGrid}>
            {[
              {
                label: "My Bookings",
                icon: "bookmark-outline" as const,
                route: "/(tabs)/counselling-dashboard/my-bookings",
                color: "#8B5CF6",
                bg: "#EDE9FE",
              },
              {
                label: "Reports",
                icon: "document-text-outline" as const,
                route: "/(tabs)/counselling-dashboard/reports",
                color: "#EC4899",
                bg: "#FCE7F3",
              },
              {
                label: "Peer Counsellors",
                icon: "people-outline" as const,
                route: "/(tabs)/counselling-dashboard/peer-counsellors",
                color: "#10B981",
                bg: "#D1FAE5",
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.navCard}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.navIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.navLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Upcoming Sessions */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            {upcomingSessions.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/counselling-dashboard/my-bookings" as any)}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingSessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {upcomingSessions.map((s: any, index: number) => {
                const dateObj = new Date(s.date);
                return (
                  <View key={s.id} style={styles.sessionCard}>
                    <View style={styles.sessionDateBox}>
                      <Text style={styles.sessionDateMonth}>
                        {dateObj.toLocaleString("default", { month: "short" }).toUpperCase()}
                      </Text>
                      <Text style={styles.sessionDateDay}>{dateObj.getDate()}</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                      {s.title ? (
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4 }}>{s.title}</Text>
                      ) : null}
                      <Text style={styles.sessionStudentName}>{s.student_name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.sessionTime}>
                          {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text style={styles.sessionLocation}>{s.location || "TBD"}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(s.status)}15` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(s.status) }]}>
                        {s.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyBlock}>
              <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No upcoming sessions</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() =>
                  router.push(`/support/schedule-session?asCounsellor=true&unitId=2` as any)
                }
              >
                <Text style={styles.emptyActionText}>Book One Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Recent Completed Sessions */}
        {recentSessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
            </View>
            <View style={styles.sessionsList}>
              {recentSessions.map((s: any) => {
                const dateObj = new Date(s.date);
                return (
                  <View key={s.id} style={[styles.recentCard]}>
                    <View style={{ flex: 1 }}>
                      {s.title ? (
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 2 }}>{s.title}</Text>
                      ) : null}
                      <Text style={styles.recentStudentName}>{s.student_name}</Text>
                      <Text style={styles.recentDate}>
                        {dateObj.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: "#D1FAE5" },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: "#059669" }]}>COMPLETED</Text>
                      </View>
                      {s.has_report ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="document-text" size={12} color="#10B981" />
                          <Text style={{ fontSize: 11, color: "#10B981", fontWeight: "600" }}>
                            Report filed
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="alert-circle" size={12} color="#F59E0B" />
                          <Text style={{ fontSize: 11, color: "#F59E0B", fontWeight: "600" }}>
                            No report
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FB" },
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 },
    }),
    zIndex: 10,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  header: { fontSize: 34, fontWeight: "900", color: "#111827", letterSpacing: -1 },

  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingTop: 28 },

  // Quick Actions
  quickActions: { gap: 12 },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    padding: 20,
    borderRadius: 24,
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24 },
      android: { elevation: 8 },
    }),
  },
  primaryActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 },
  primaryActionSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    alignItems: "flex-start",
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 32, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  statLabel: { fontSize: 13, fontWeight: "700", color: "#6B7280" },

  // Alert
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { fontSize: 15, fontWeight: "800", color: "#B91C1C", marginBottom: 2 },
  alertSub: { fontSize: 13, color: "#DC2626", fontWeight: "500" },
  alertAction: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  alertActionText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },

  // Nav Grid
  navGrid: { gap: 10 },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 20,
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#111827" },
  seeAll: { fontSize: 14, fontWeight: "800", color: "#4F46E5" },

  // Sessions List
  sessionsList: { gap: 12, marginTop: 12 },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  sessionDateBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionDateMonth: { fontSize: 10, fontWeight: "800", color: "#4F46E5", letterSpacing: 0.5 },
  sessionDateDay: { fontSize: 20, fontWeight: "900", color: "#312E81" },
  sessionInfo: { flex: 1, gap: 4 },
  sessionStudentName: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 2 },
  sessionTime: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  sessionLocation: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  // Recent Sessions
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  recentStudentName: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4 },
  recentDate: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  // Empty State
  emptyBlock: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F3F4F6",
    borderStyle: "dashed",
    gap: 12,
    marginTop: 12,
  },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#9CA3AF" },
  emptyAction: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyActionText: { fontSize: 14, fontWeight: "700", color: "#4F46E5" },
});
