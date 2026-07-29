import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Image, TextInput } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function FreshersScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // TODO: Review and potentially increase this staleTime duration (currently 5 minutes)
  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin', 'freshers', debouncedSearch],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`${API_URL}/support/admin/freshers?page=${pageParam}&limit=20&search=${encodeURIComponent(debouncedSearch)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch freshers");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.meta && allPages.length < lastPage.meta.totalPages) {
        return allPages.length + 1;
      }
      if (!lastPage.meta && lastPage.data?.length === 20) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const freshers = React.useMemo(() => data?.pages.flatMap(page => page.data || []) || [], [data]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Freshers</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search freshers..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A2B4A" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={freshers}
          keyExtractor={(f, index) => `${f.id}-${index}`}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#1A2B4A" style={{ margin: 20 }} /> : null}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.fresherCard} 
              activeOpacity={0.7}
              onPress={() => router.push(`/user/${item.id}` as any)}
            >
              <View style={styles.avatarContainer}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.fresherInfo}>
                <Text style={styles.fresherName}>{item.full_name}</Text>
                <Text style={styles.fresherMeta}>
                  {item.country || "Unknown"} • {item.major || "Undeclared"}
                </Text>
                <Text style={styles.fresherSub}>Coach: {item.coach_name || "Unassigned"}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.completed_sessions} / 3</Text>
              </View>
            </TouchableOpacity>
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
  
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#E5E7EB", marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 16, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#1A2B4A" },

  listContent: { padding: 20, gap: 12 },
  fresherCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", padding: 16, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  fresherInfo: { flex: 1 },
  fresherName: { fontSize: 16, fontWeight: "700", color: "#1A2B4A", marginBottom: 4 },
  fresherMeta: { fontSize: 13, color: "#3B82F6", marginBottom: 4, fontWeight: "600" },
  fresherSub: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  
  statusBadge: { backgroundColor: "#F0F2F5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 13, fontWeight: "800", color: "#1A2B4A" },
});
