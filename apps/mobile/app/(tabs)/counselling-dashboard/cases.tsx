import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import ReassignCaseModal from "../../../components/features/counselling/ReassignCaseModal";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
};

export default function CasesScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isReassignModalVisible, setReassignModalVisible] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: cases = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['counselling-cases'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/support/counselling/cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch cases");
      return res.json();
    },
    enabled: !!token,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const resolveMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await fetch(`${API_URL}/support/counselling/assignments/${assignmentId}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to resolve case");
      return res.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Case marked as resolved.");
      queryClient.invalidateQueries({ queryKey: ['counselling-cases'] });
    },
    onError: () => {
      Alert.alert("Error", "Could not resolve case.");
    }
  });

  const handleResolve = (assignmentId: string) => {
    Alert.alert(
      "Resolve Case",
      "Are you sure you want to mark this case as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Resolve", 
          style: "default", 
          onPress: () => resolveMutation.mutate(assignmentId) 
        }
      ]
    );
  };

  const activeCases = cases.filter((c: any) => c.status !== "resolved");
  const resolvedCases = cases.filter((c: any) => c.status === "resolved");

  const displayedCases = activeTab === "active" ? activeCases : resolvedCases;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.header}>Manage Cases</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>Active Cases ({activeCases.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "resolved" && styles.activeTab]}
          onPress={() => setActiveTab("resolved")}
        >
          <Text style={[styles.tabText, activeTab === "resolved" && styles.activeTabText]}>Resolved ({resolvedCases.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#4F46E5" />}
      >
        {displayedCases.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="folder.fill" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No {activeTab} cases found.</Text>
          </View>
        ) : (
          displayedCases.map((item: any, index: number) => (
            <Animated.View key={`${item.assignment_id}-${index}`} entering={FadeInDown.delay(index * 50).duration(400)}>
              <View style={styles.caseCard}>
                <View style={styles.cardHeader}>
                  <Image 
                    source={{ uri: resolveImageUrl(item.student_avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student_name)}&background=random` }} 
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.student_name}</Text>
                    <Text style={styles.userDetail}>{item.student_email}</Text>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'resolved' ? styles.statusResolved : styles.statusActive]}>
                    <Text style={[styles.statusText, item.status === 'resolved' ? styles.statusTextResolved : styles.statusTextActive]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.detailText}>
                    <Text style={styles.boldText}>Assigned Peer Counsellor:</Text> {item.peer_counsellor_name}
                  </Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.boldText}>Assigned Date:</Text> {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  {item.status === 'resolved' && item.resolved_at && (
                    <Text style={styles.detailText}>
                      <Text style={styles.boldText}>Resolved Date:</Text> {new Date(item.resolved_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {item.status !== "resolved" && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.resolveBtn]}
                      onPress={() => handleResolve(item.assignment_id)}
                      disabled={resolveMutation.isPending}
                    >
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#059669" />
                      <Text style={styles.resolveBtnText}>Resolve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.reassignBtn]}
                      onPress={() => {
                        setSelectedCase(item);
                        setReassignModalVisible(true);
                      }}
                    >
                      <IconSymbol name="arrow.triangle.2.circlepath" size={18} color="#4F46E5" />
                      <Text style={styles.reassignBtnText}>Reassign</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {isReassignModalVisible && selectedCase && (
        <ReassignCaseModal 
          visible={isReassignModalVisible}
          onClose={() => setReassignModalVisible(false)}
          assignmentId={selectedCase.assignment_id}
          currentPeerId={selectedCase.peer_counsellor_id}
          studentName={selectedCase.student_name}
          onSuccess={() => refetch()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 10, backgroundColor: "#FFFFFF" },
  backButton: { marginRight: 16 },
  header: { fontSize: 24, fontWeight: "700", color: "#111827" },
  tabsContainer: { flexDirection: "row", backgroundColor: "#FFFFFF", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#4F46E5" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#4F46E5" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  caseCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F3F4F6" },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  userDetail: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusActive: { backgroundColor: "#EEF2FF" },
  statusResolved: { backgroundColor: "#D1FAE5" },
  statusText: { fontSize: 11, fontWeight: "700" },
  statusTextActive: { color: "#4F46E5" },
  statusTextResolved: { color: "#059669" },
  cardBody: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8, marginBottom: 16 },
  detailText: { fontSize: 14, color: "#4B5563", marginBottom: 4 },
  boldText: { fontWeight: "600", color: "#111827" },
  cardActions: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  resolveBtn: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  resolveBtnText: { color: "#059669", fontWeight: "600", marginLeft: 8 },
  reassignBtn: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" },
  reassignBtnText: { color: "#4F46E5", fontWeight: "600", marginLeft: 8 },
});
