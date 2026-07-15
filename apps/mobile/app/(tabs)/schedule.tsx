import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { Modal } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function ScheduleScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const token = session?.accessToken;
  const currentUserId = session?.user?.id;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { filter } = useLocalSearchParams();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'mine'
  const [activeFilter, setActiveFilter] = useState(filter ? filter as string : "all");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/support/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchSessions();
  }, [token]);

  const displayedSessions = sessions.filter((s: any) => {
    if (activeTab === "mine" && s.student_id !== currentUserId && s.provider_id !== currentUserId) return false;
    if (activeFilter === "upcoming" && s.status !== "booked" && s.status !== "scheduled") return false;
    if (activeFilter === "overdue" && s.status !== "overdue") return false;
    if (activeFilter === "completed" && s.status !== "completed") return false;
    return true;
  });

  const handleUpdateStatus = async (id: number, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/support/sessions/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        setSelectedSession(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/support/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        setSelectedSession(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#10B981";
      case "booked": return "#3B82F6";
      case "cancelled": return "#EF4444";
      default: return "#6B7280";
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Schedule</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]} 
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All Sessions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "mine" && styles.activeTab]} 
          onPress={() => setActiveTab("mine")}
        >
          <Text style={[styles.tabText, activeTab === "mine" && styles.activeTabText]}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {["all", "upcoming", "overdue", "completed"].map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} tintColor="#1A2B4A" />}
      >
        {displayedSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar.badge.exclamationmark" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No sessions found.</Text>
          </View>
        ) : (
          displayedSessions.map((item: any, index: number) => {
            const dateObj = new Date(item.date);
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 50).duration(400)}>
                <TouchableOpacity style={styles.card} onPress={() => setSelectedSession(item)} activeOpacity={0.7}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateMonth}>{dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                      <Text style={styles.dateDay}>{dateObj.getDate()}</Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeText}>
                        {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                      <Text style={styles.typeText}>{item.type === "peer_coach" ? "Peer Coaching" : "Advising"}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.participantsRow}>
                    <View style={styles.participant}>
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>{item.provider_name?.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.roleLabel}>Coach</Text>
                        <Text style={styles.nameText}>{item.provider_name}</Text>
                      </View>
                    </View>
                    <IconSymbol name="arrow.right" size={16} color="#9CA3AF" />
                    <View style={styles.participant}>
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>{item.student_name?.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.roleLabel}>Student</Text>
                        <Text style={styles.nameText}>{item.student_name}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <IconSymbol name="mappin.and.ellipse" size={14} color="#6B7280" />
                    <Text style={styles.locationText}>{item.location || "TBD"}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Session Details Modal */}
      <Modal visible={!!selectedSession} animationType="slide" transparent={true} onRequestClose={() => setSelectedSession(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Details</Text>
              <TouchableOpacity onPress={() => setSelectedSession(null)} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={24} color="#1A2B4A" />
              </TouchableOpacity>
            </View>
            
            {selectedSession && (
              <ScrollView style={{ paddingHorizontal: 20 }}>
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.modalLabel}>Date & Time</Text>
                  <Text style={styles.modalValue}>{new Date(selectedSession.date).toLocaleString()}</Text>
                </View>
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.modalLabel}>Location</Text>
                  <Text style={styles.modalValue}>{selectedSession.location || "TBD"}</Text>
                </View>
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.modalLabel}>Participants</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{selectedSession.provider_name?.charAt(0)}</Text></View>
                    <Text style={styles.modalValue}>{selectedSession.provider_name} <Text style={{ color: "#9CA3AF", fontSize: 13 }}>(Coach)</Text></Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{selectedSession.student_name?.charAt(0)}</Text></View>
                    <Text style={styles.modalValue}>{selectedSession.student_name} <Text style={{ color: "#9CA3AF", fontSize: 13 }}>(Student)</Text></Text>
                  </View>
                </View>
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={[styles.modalValue, !selectedSession.description && { color: "#9CA3AF", fontStyle: "italic" }]}>
                    {selectedSession.description || "No description added"}
                  </Text>
                </View>
                
                <View style={styles.modalActions}>
                  {(selectedSession.status === 'booked' || selectedSession.status === 'overdue') && (
                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#10B981" }]} onPress={() => handleUpdateStatus(selectedSession.id, 'completed')} disabled={actionLoading}>
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                      <Text style={styles.modalBtnText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={[styles.modalBtn, { backgroundColor: "#3B82F6" }]} 
                    onPress={() => {
                      setSelectedSession(null);
                      router.push({
                        pathname: "/support/schedule-session",
                        params: {
                          sessionId: selectedSession.id,
                          editDate: selectedSession.date,
                          editLocation: selectedSession.location || "",
                          editDescription: selectedSession.description || "",
                          editStudentId: selectedSession.student_id,
                          editStudentName: selectedSession.student_name,
                        }
                      } as any);
                    }} 
                    disabled={actionLoading}
                  >
                    <IconSymbol name="pencil" size={20} color="#FFFFFF" />
                    <Text style={styles.modalBtnText}>Edit Session</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#EF4444" }]} onPress={() => handleDeleteSession(selectedSession.id)} disabled={actionLoading}>
                    <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.modalBtnText}>Delete Session</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <Animated.View entering={SlideInDown.delay(500).duration(500)} style={[styles.fabContainer, { paddingBottom: insets.bottom || 24 }]}>
        <Pressable 
          style={({ pressed }) => [styles.fabPrimary, pressed && styles.fabPressed]} 
          onPress={() => router.push(`/support/schedule-session` as any)}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.fabTextPrimary}>New Session</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  header: { fontSize: 32, fontWeight: "900", color: "#1A2B4A", letterSpacing: -1 },
  
  tabContainer: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#E5E7EB", padding: 4, borderRadius: 12, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#FFFFFF", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 2 } }) },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#1A2B4A", fontWeight: "700" },
  
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 } }) },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  dateBox: { width: 48, height: 48, backgroundColor: "#F3F4F6", borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  dateMonth: { fontSize: 10, fontWeight: "800", color: "#A93C40", textTransform: "uppercase" },
  dateDay: { fontSize: 18, fontWeight: "900", color: "#1A2B4A" },
  timeInfo: { flex: 1 },
  timeText: { fontSize: 15, fontWeight: "700", color: "#1A2B4A", marginBottom: 2 },
  typeText: { fontSize: 12, color: "#6B7280" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800" },
  
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  
  participantsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  participant: { flexDirection: "row", alignItems: "center", flex: 1, gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6" },
  roleLabel: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
  nameText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F9FAFB", padding: 10, borderRadius: 10 },
  locationText: { fontSize: 13, color: "#4B5563", fontWeight: "500" },
  
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#6B7280", fontWeight: "600" },
  
  fabContainer: {
    position: "absolute",
    bottom: 24, right: 24,
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
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#E5E7EB", borderRadius: 20 },
  filterChipActive: { backgroundColor: "#1A2B4A" },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterChipTextActive: { color: "#FFFFFF" },
  
  avatarFallback: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1A2B4A" },
  closeBtn: { padding: 4 },
  modalLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: 4, marginTop: 12 },
  modalValue: { fontSize: 16, color: "#1A2B4A", fontWeight: "500" },
  modalActions: { marginTop: 40, gap: 12 },
  modalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 16 },
  modalBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" }
});
