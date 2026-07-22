import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function AssignmentsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const queryClient = useQueryClient();
  const [selectedFresher, setSelectedFresher] = useState<any>(null);

  const { data: freshers = [], isLoading: loadingFreshers } = useQuery({
    queryKey: ['admin-freshers'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/support/admin/freshers`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch freshers");
      return res.json();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: coaches = [], isLoading: loadingCoaches } = useQuery({
    queryKey: ['admin-coaches'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/support/admin/coaches`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch coaches");
      return res.json();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const loading = loadingFreshers || loadingCoaches;

  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/support/admin/assignments/bulk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error("Bulk assign failed");
      return res.json();
    },
    onSuccess: (data) => {
      Alert.alert("Success", `Assigned ${data.assignedCount} freshers successfully.`);
      queryClient.invalidateQueries({ queryKey: ['admin-freshers'] });
    },
    onError: (err) => console.error(err),
  });

  const bulkAssign = () => {
    if (coaches.length === 0) return Alert.alert("Error", "No active coaches found.");
    bulkAssignMutation.mutate();
  };

  const assignSingleMutation = useMutation({
    mutationFn: async (coachId: string) => {
      const res = await fetch(`${API_URL}/support/admin/assignments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fresherId: selectedFresher.id, coachId })
      });
      if (!res.ok) throw new Error("Assign single failed");
      return res.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Fresher assigned successfully.");
      setSelectedFresher(null);
      queryClient.invalidateQueries({ queryKey: ['admin-freshers'] });
    },
    onError: (err) => console.error(err),
  });

  const assignSingle = (coachId: string) => {
    assignSingleMutation.mutate(coachId);
  };

  const assigning = bulkAssignMutation.isPending || assignSingleMutation.isPending;

  const unassignedFreshers = freshers.filter(f => !f.coach_name);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignments</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Select an unassigned fresher and assign them to a peer coach.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1A2B4A" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.columns}>
            <View style={styles.columnHeaderRow}>
              <Text style={styles.columnTitle}>Unassigned Freshers ({unassignedFreshers.length})</Text>
              {unassignedFreshers.length > 0 && (
                <TouchableOpacity style={styles.bulkBtn} onPress={bulkAssign} disabled={assigning}>
                  <Text style={styles.bulkBtnText}>Auto-Assign All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.column}>
              {unassignedFreshers.map(f => (
                <View key={f.id} style={styles.card}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.cardName}>{f.full_name}</Text>
                    {(f.country || f.major) && (
                      <Text style={styles.cardSub}>
                        {f.country || "Unknown"} • {f.major || "Undeclared"}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedFresher(f)}>
                    <Text style={styles.actionText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {unassignedFreshers.length === 0 && (
                <Text style={styles.emptyText}>All freshers are assigned!</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal for selecting a coach */}
      <Modal visible={!!selectedFresher} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Coach</Text>
              <TouchableOpacity onPress={() => setSelectedFresher(null)}>
                <IconSymbol name="xmark" size={24} color="#1A2B4A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Assigning coach for {selectedFresher?.full_name}</Text>
            
            <FlatList
              data={coaches}
              keyExtractor={c => c.id}
              contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.coachSelectItem} onPress={() => assignSingle(item.id)}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.coachSelectName}>{item.full_name}</Text>
                    {(item.country || item.major) && (
                      <Text style={styles.coachSelectSubMeta}>
                        {item.country || "Unknown"} • {item.major || "Undeclared"}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.coachSelectSub}>{item.assigned_count} assigned</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4A" },
  placeholder: { width: 40 },
  
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20 },
  
  infoBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 16, borderRadius: 16, gap: 12 },
  infoText: { flex: 1, fontSize: 14, color: "#1E3A8A", lineHeight: 20 },
  
  columns: { flex: 1 },
  columnHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  columnTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4A" },
  bulkBtn: { backgroundColor: "#1A2B4A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bulkBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  column: { flex: 1, gap: 12 },
  
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardName: { fontSize: 15, fontWeight: "600", color: "#1A2B4A" },
  cardSub: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  actionBtn: { backgroundColor: "#F0F2F5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: "700", color: "#1A2B4A" },
  
  emptyText: { color: "#6B7280", fontSize: 14, fontStyle: "italic", marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4A" },
  modalSub: { fontSize: 14, color: "#6B7280", marginBottom: 12 },
  coachSelectItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#F8F9FA", borderRadius: 12 },
  coachSelectName: { fontSize: 16, fontWeight: "600", color: "#1A2B4A" },
  coachSelectSubMeta: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  coachSelectSub: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
});
