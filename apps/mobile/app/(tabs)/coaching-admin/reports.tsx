import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function ReportsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/support/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setReports(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
  }, [token]);

  const toggleFlag = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_URL}/support/admin/reports/${id}/flag`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ needsFollowUp: !currentStatus })
      });
      // Optimistic update
      setReports(prev => prev.map(r => r.id === id ? { ...r, needs_follow_up: !currentStatus } : r));
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
        <Text style={styles.headerTitle}>Session Reports</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A2B4A" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyBox}>
              <IconSymbol name="doc.text.fill" size={32} color="#9BA3AE" />
              <Text style={styles.emptyText}>No reports submitted yet.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View>
                  <Text style={styles.reportNames}>{item.student_name}</Text>
                  <Text style={styles.reportSub}>Coach: {item.provider_name}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFlag(item.id, item.needs_follow_up)}>
                  <IconSymbol 
                    name={item.needs_follow_up ? "flag.fill" : "flag"} 
                    size={24} 
                    color={item.needs_follow_up ? "#A93C40" : "#C4C8D0"} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.dateText}>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</Text>
              
              <View style={styles.contentBox}>
                <Text style={styles.contentText} numberOfLines={3}>
                  {item.content?.notes || "No notes provided."}
                </Text>
              </View>
            </View>
          )}
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
  
  listContent: { padding: 20, gap: 16 },
  reportCard: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  reportNames: { fontSize: 16, fontWeight: "700", color: "#1A2B4A" },
  reportSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  dateText: { fontSize: 12, fontWeight: "600", color: "#A93C40", marginBottom: 12 },
  
  contentBox: { backgroundColor: "#F8F9FA", padding: 12, borderRadius: 12 },
  contentText: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
  
  emptyBox: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { color: "#9BA3AE", fontSize: 15, fontWeight: "600" },
});
