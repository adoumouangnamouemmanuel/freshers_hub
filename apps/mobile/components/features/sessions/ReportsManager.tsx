import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Platform, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import { Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
  endpoint: string;
};

export default function ReportsManager({ endpoint }: Props) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchReports = async (pageNum = 1, search = "") => {
    if (!token) return;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`${API_URL}${endpoint}?page=${pageNum}&limit=20&search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (pageNum === 1) {
          setReports(json.data || []);
        } else {
          setReports(prev => [...prev, ...(json.data || [])]);
        }
        setHasMore(json.meta ? pageNum < json.meta.totalPages : false);
        setPage(pageNum);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReports(1, debouncedSearch);
  }, [token, endpoint, debouncedSearch]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchReports(page + 1, debouncedSearch);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#312E81" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Reports</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#4F46E5" style={{ margin: 20 }} /> : null}
          ListEmptyComponent={() => (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Reports Yet</Text>
              <Text style={styles.emptyText}>
                Reports will appear here after you submit them for completed sessions.
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const sessionDate = item.session_date ? new Date(item.session_date) : null;
            return (
              <View style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.studentRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {item.student_name?.charAt(0) || "S"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportStudentName}>{item.student_name}</Text>
                      {sessionDate && (
                        <Text style={styles.reportDateText}>
                          Session: {sessionDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                  {item.needs_follow_up && (
                    <View style={styles.flagBadge}>
                      <Ionicons name="flag" size={12} color="#DC2626" />
                      <Text style={styles.flagText}>Follow Up</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.submittedText}>
                  Report filed: {new Date(item.submitted_at).toLocaleDateString()}
                </Text>

                <View style={styles.contentBox}>
                  <Text style={styles.contentText} numberOfLines={4}>
                    {item.content?.notes || item.content?.summary || "No notes provided."}
                  </Text>
                </View>

                {item.content?.topics && (
                  <View style={styles.topicsRow}>
                    {(Array.isArray(item.content.topics) ? item.content.topics : [item.content.topics]).map(
                      (topic: string, i: number) => (
                        <View key={i} style={styles.topicChip}>
                          <Text style={styles.topicText}>{topic}</Text>
                        </View>
                      )
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#E5E7EB", marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 16, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#1A2B4A" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#312E81" },
  placeholder: { width: 40 },

  listContent: { padding: 20, gap: 16 },

  reportCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#4F46E5" },
  reportStudentName: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 2 },
  reportDateText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  flagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flagText: { fontSize: 11, fontWeight: "700", color: "#DC2626" },

  submittedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 12,
  },

  contentBox: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 16,
  },
  contentText: { fontSize: 14, color: "#4B5563", lineHeight: 22 },

  topicsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  topicChip: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topicText: { fontSize: 12, fontWeight: "700", color: "#4F46E5" },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  emptyText: { color: "#9CA3AF", fontSize: 14, fontWeight: "500", textAlign: "center", lineHeight: 22 },
});
