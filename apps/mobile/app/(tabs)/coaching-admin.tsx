import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function CoachingAdminScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    // Mocking the fetch for now until we build the actual endpoint in Day 12/17
    setTimeout(() => {
      setDashboardData({
        assignedFreshers: 120,
        compliantFreshers: 45,
        atRiskFreshers: 12,
        activeCoaches: 24,
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Coaching Admin</Text>
        <Text style={styles.subHeader}>
          Overview of peer coaching compliance and coach management.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.iconBg, { backgroundColor: '#1A2B4A15' }]}>
                  <IconSymbol name="person.3.fill" size={24} color="#1A2B4A" />
                </View>
                <Text style={styles.statValue}>{dashboardData?.assignedFreshers}</Text>
                <Text style={styles.statLabel}>Total Freshers</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.iconBg, { backgroundColor: '#25D36615' }]}>
                  <IconSymbol name="checkmark.seal.fill" size={24} color="#25D366" />
                </View>
                <Text style={styles.statValue}>{dashboardData?.compliantFreshers}</Text>
                <Text style={styles.statLabel}>Compliant</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.iconBg, { backgroundColor: '#A93C4015' }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#A93C40" />
                </View>
                <Text style={styles.statValue}>{dashboardData?.atRiskFreshers}</Text>
                <Text style={styles.statLabel}>At Risk</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.iconBg, { backgroundColor: '#C9933A15' }]}>
                  <IconSymbol name="star.fill" size={24} color="#C9933A" />
                </View>
                <Text style={styles.statValue}>{dashboardData?.activeCoaches}</Text>
                <Text style={styles.statLabel}>Active Coaches</Text>
              </View>
            </View>
            
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Compliance Tracking</Text>
                <Text style={styles.seeAllText}>View Report</Text>
              </View>
              <Text style={styles.sectionDesc}>Detailed breakdown of freshers who have not met the 3-session requirement.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  headerContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  header: { fontSize: 28, fontWeight: "800", color: "#1A2B4A", letterSpacing: -0.5 },
  subHeader: { fontSize: 15, color: "#6B7280", marginTop: 6, lineHeight: 22 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statValue: { fontSize: 28, fontWeight: "800", color: "#1A2B4A", marginBottom: 4 },
  statLabel: { fontSize: 14, color: "#6B7280", fontWeight: "600" },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1A2B4A" },
  seeAllText: { fontSize: 14, fontWeight: "700", color: "#A93C40" },
  sectionDesc: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
});
