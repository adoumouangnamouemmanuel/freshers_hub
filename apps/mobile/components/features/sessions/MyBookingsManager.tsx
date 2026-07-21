import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import SessionDetailModal from "./SessionDetailModal";
import { getUnitLabel, getProviderRoleLabel } from "../../../lib/session-utils";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

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

type Props = {
  unitId?: number;
};

export default function MyBookingsManager({ unitId }: Props) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchMyBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/support/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter by unit_id if provided
        const filteredSessions = unitId ? data.filter((s: any) => s.unit_id === unitId) : data;
        setSessions(filteredSessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyBookings();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "scheduled":
        return "#4F46E5";
      case "cancelled":
        return "#EF4444";
      case "overdue":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const now = new Date();
  const processedSessions = sessions.map((s) => {
    const sessionDate = s.date || s.scheduled_at || new Date().toISOString();
    const isOverdue = s.status === "scheduled" && new Date(sessionDate) < now;
    return { ...s, status: isOverdue ? "overdue" : s.status };
  });

  const displayedSessions = processedSessions.filter((s: any) => {
    if (activeFilter === "upcoming" && s.status !== "scheduled") return false;
    if (activeFilter === "overdue" && s.status !== "overdue") return false;
    if (activeFilter === "completed" && s.status !== "completed") return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#312E81" />
        </TouchableOpacity>
        <Text style={styles.header}>My Bookings</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterScroll}>
          {(["all", "upcoming", "overdue", "completed"] as FilterStatus[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
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
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={displayedSessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No sessions found.</Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            const dateStr = item.date || item.scheduled_at || new Date().toISOString();
            const dateObj = new Date(dateStr);
            return (
              <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => setSelectedSession(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateMonth}>
                        {dateObj.toLocaleString("default", { month: "short" }).toUpperCase()}
                      </Text>
                      <Text style={styles.dateDay}>{dateObj.getDate()}</Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeText}>
                        {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      <Text style={styles.typeText}>{getUnitLabel(item.unit_id, item.type)} SESSION</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}15` },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(item.status) }]}
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
                      <View style={[styles.avatarFallback, { backgroundColor: "#E0E7FF" }]}>
                        <Text style={[styles.avatarFallbackText, { color: "#4F46E5" }]}>
                          {item.provider_name?.charAt(0) || "A"}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.roleLabel}>{getProviderRoleLabel(item.unit_id, item.type)}</Text>
                        <Text style={styles.nameText}>{item.provider_name || "Unknown"}</Text>
                      </View>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#D1D5DB" />
                    <View style={styles.participant}>
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>
                          {item.student_name?.charAt(0) || "S"}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.roleLabel}>Student</Text>
                        <Text style={styles.nameText}>{item.student_name || "Unknown"}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.locationText}>{item.location || "TBD"}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}

      <SessionDetailModal
        session={selectedSession}
        visible={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onRefresh={fetchMyBookings}
        currentUserId={session?.user?.id}
        accessToken={session?.accessToken}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FB" },
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
  header: { fontSize: 32, fontWeight: "900", color: "#312E81", letterSpacing: -1, marginLeft: 16 },

  filterContainer: { marginBottom: 16, paddingBottom: 4 },
  filterScroll: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#E5E7EB", borderRadius: 20 },
  filterChipActive: { backgroundColor: "#4F46E5" },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterChipTextActive: { color: "#FFFFFF" },

  listContent: { padding: 20, gap: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
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
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  dateBox: {
    width: 48,
    height: 48,
    backgroundColor: "#E0E7FF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateMonth: { fontSize: 10, fontWeight: "800", color: "#4F46E5", textTransform: "uppercase" },
  dateDay: { fontSize: 18, fontWeight: "900", color: "#312E81" },
  timeInfo: { flex: 1 },
  timeText: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 2 },
  typeText: { fontSize: 12, color: "#6B7280", fontWeight: "600", letterSpacing: 0.5 },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
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
});
