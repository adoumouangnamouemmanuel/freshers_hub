import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import SessionDetailModal from "./SessionDetailModal";
import { getUnitLabel, getProviderRoleLabel } from "@/lib/session-utils";

type Session = {
  id: string;
  title: string;
  type: string;
  date: string;
  scheduled_at?: string;
  location: string;
  description: string;
  status: string;
  is_mandatory: boolean;
  provider_name: string;
  student_name?: string;
  provider_id: string;
  student_id: string;
  provider_avatar: string;
  unit_id?: number;
};

type FilterStatus = "all" | "upcoming" | "overdue" | "completed";

type SessionsManagerProps = {
  endpoint: string;
  title: string;
  isAdminView?: boolean;
  hideBackButton?: boolean;
  hideMySessions?: boolean;
  showFab?: boolean;
  isCounsellorView?: boolean;
};

export default function SessionsManager({
  endpoint,
  title,
  isAdminView = false,
  hideBackButton = false,
  hideMySessions = false,
  showFab = true,
  isCounsellorView = false,
}: SessionsManagerProps) {
  const router = useRouter();
  const { session: authSession } = useAuth();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  // Modal State
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchSessions = async () => {
    if (!authSession?.accessToken) return;
    try {
      const data = await apiRequest<Session[]>(endpoint, {
        headers: { Authorization: `Bearer ${authSession.accessToken}` },
      });
      setSessions(data || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [authSession?.accessToken, endpoint]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "scheduled":
        return "#3B82F6";
      case "cancelled":
        return "#EF4444";
      case "overdue":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Update internal logic for overdue and filter out coach admin's own sessions
  let processedSessions = sessions.map((s) => {
    const sessionDate = s.date || s.scheduled_at || new Date().toISOString();
    const isOverdue = s.status === "scheduled" && new Date(sessionDate) < oneHourAgo;
    return { ...s, status: isOverdue ? "overdue" : s.status };
  });

  // If hideMySessions is true, filter out sessions where the current user is the provider
  if (hideMySessions && authSession?.user?.id) {
    processedSessions = processedSessions.filter(
      (s) => s.provider_id !== authSession.user.id,
    );
  }

  const displayedSessions = processedSessions.filter((s: any) => {
    if (activeFilter === "upcoming" && s.status !== "scheduled") return false;
    if (activeFilter === "overdue" && s.status !== "overdue") return false;
    if (activeFilter === "completed" && s.status !== "completed") return false;

    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        {!hideBackButton && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <Text style={[styles.header, !hideBackButton && { marginLeft: 16 }]}>
          {title}
        </Text>
      </View>

      {/* Tab removed - sessions screen now shows all sessions only */}

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        >
          {(["all", "upcoming", "overdue", "completed"] as FilterStatus[]).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  activeFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A2B4A" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1A2B4A"
            />
          }
        >
          {displayedSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                name="calendar.badge.exclamationmark"
                size={48}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>No sessions found.</Text>
            </View>
          ) : (
            displayedSessions.map((item: any, index: number) => {
              const dateStr =
                item.date || item.scheduled_at || new Date().toISOString();
              const dateObj = new Date(dateStr);
              
              const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
              const formattedMonth = isNaN(dateObj.getTime()) ? "UNK" : monthNames[dateObj.getMonth()];
              const formattedDay = isNaN(dateObj.getTime()) ? "--" : dateObj.getDate();
              
              const hours = dateObj.getHours();
              const minutes = dateObj.getMinutes();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const formattedHours = hours % 12 || 12;
              const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
              const formattedTime = isNaN(dateObj.getTime()) ? "--:--" : `${formattedHours}:${formattedMinutes} ${ampm}`;

              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => setSelectedSession(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.dateBox}>
                        <Text style={styles.dateMonth}>
                          {formattedMonth}
                        </Text>
                        <Text style={styles.dateDay}>{formattedDay}</Text>
                      </View>
                      <View style={styles.timeInfo}>
                        <Text style={styles.timeText}>
                          {formattedTime}
                        </Text>
                        <Text style={styles.typeText}>
                          {getUnitLabel(item.unit_id, item.type)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: `${getStatusColor(item.status)}15`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) },
                          ]}
                        >
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {item.title ? (
                      <Text style={styles.sessionTitle}>{item.title}</Text>
                    ) : null}

                    <View style={styles.divider} />

                    <View style={styles.participantsRow}>
                      <View style={styles.participant}>
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>
                            {item.provider_name?.charAt(0) || "C"}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.roleLabel}>{getProviderRoleLabel(item.unit_id, item.type)}</Text>
                          <Text style={styles.nameText}>
                            {item.provider_name || "Unknown"}
                          </Text>
                        </View>
                      </View>
                      <IconSymbol
                        name="arrow.right"
                        size={16}
                        color="#9CA3AF"
                      />
                      <View style={styles.participant}>
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>
                            {item.student_name?.charAt(0) || "S"}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.roleLabel}>Student</Text>
                          <Text style={styles.nameText}>
                            {item.student_name || "Unknown"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.locationRow}>
                      <IconSymbol
                        name="mappin.and.ellipse"
                        size={14}
                        color="#6B7280"
                      />
                      <Text style={styles.locationText}>
                        {item.location || "TBD"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}

      <SessionDetailModal
        session={selectedSession}
        visible={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onRefresh={fetchSessions}
        currentUserId={authSession?.user?.id}
        accessToken={authSession?.accessToken}
        isCounsellorView={isCounsellorView}
      />

      {/* Floating Action Button */}
      {isAdminView && showFab && (
        <Animated.View
          entering={SlideInDown.delay(500).duration(500)}
          style={[styles.fabContainer, { paddingBottom: insets.bottom || 24 }]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.fabPrimary,
              pressed && styles.fabPressed,
            ]}
            onPress={() => router.push(`/support/schedule-session` as any)}
          >
            <IconSymbol name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.fabTextPrimary}>New Session</Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1A2B4A",
    letterSpacing: -1,
  },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#E5E7EB",
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeTab: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#1A2B4A", fontWeight: "700" },

  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 150 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  dateBox: {
    width: 48,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A93C40",
    textTransform: "uppercase",
  },
  dateDay: { fontSize: 18, fontWeight: "900", color: "#1A2B4A" },
  timeInfo: { flex: 1 },
  timeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 2,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800" },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },

  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  participant: { flexDirection: "row", alignItems: "center", flex: 1, gap: 8 },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  roleLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  nameText: { fontSize: 13, fontWeight: "700", color: "#111827" },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
  },
  locationText: { fontSize: 13, color: "#4B5563", fontWeight: "500" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#6B7280", fontWeight: "600" },

  fabContainer: {
    position: "absolute",
    bottom: 100,
    right: 24,
  },
  fabPrimary: {
    backgroundColor: "#A93C40",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 10,
    shadowColor: "#A93C40",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  fabTextPrimary: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  filterContainer: { marginBottom: 16, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 20,
  },
  filterChipActive: { backgroundColor: "#1A2B4A" },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterChipTextActive: { color: "#FFFFFF" },
});
