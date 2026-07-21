import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, TextInput, FlatList } from "react-native";
import globalStyles from '../../styles';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { hasRole, isAdvisor } from "../../lib/permissions";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function StudentsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'freshers', 'coaches'
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isAdvisorUser = hasRole(session?.user?.roles || [], "advisor");
  const isCounsellorUser = hasRole(session?.user?.roles || [], "counsellor");
  const showClassYears = isAdvisorUser || isCounsellorUser;

  const fetchDirectory = async (pageNum = 1) => {
    try {
      const endpoint = isCounsellorUser ? '/support/counselling/students' : (isAdvisorUser ? '/support/advising/students' : '/support/admin/students');
      const res = await fetch(`${API_URL}${endpoint}?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const responseData = await res.json();
        const rawData = responseData.data || [];
        
        if (pageNum === 1) {
          setUsers(rawData);
        } else {
          setUsers(prev => [...prev, ...rawData]);
        }
        
        if (responseData.meta) {
          setHasMore(pageNum < responseData.meta.totalPages);
        } else {
          setHasMore(rawData.length === 20);
        }
        setPage(pageNum);
      }
    } catch (err) {
      console.error(err);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      fetchDirectory(page + 1);
    }
  };

  useEffect(() => {
    if (token) fetchDirectory(1);
  }, [token]);

  const filteredUsers = users.filter((u: any) => {
    let matchesTab = false;
    if (showClassYears) {
      matchesTab = activeTab === "all" || String(u.class_year) === activeTab;
    } else {
      matchesTab = 
        activeTab === "all" || 
        (activeTab === "freshers" && u.type === "student") || 
        (activeTab === "coaches" && u.type === "peer_coach");
    }
    
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.major?.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesTab && matchesSearch;
  });

  // Extract unique class years for the advisor/counsellor tabs
  const classYears = showClassYears 
    ? Array.from(new Set(users.map((u: any) => u.class_year).filter(Boolean))).sort()
    : [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Students</Text>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or major..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "all" && styles.activeTab]} 
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          
          {showClassYears ? (
            classYears.map((year: any) => (
              <TouchableOpacity 
                key={year}
                style={[styles.tab, activeTab === String(year) && styles.activeTab, { minWidth: 60 }]} 
                onPress={() => setActiveTab(String(year))}
              >
                <Text style={[styles.tabText, activeTab === String(year) && styles.activeTabText]}>{year}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.tab, activeTab === "freshers" && styles.activeTab]} 
                onPress={() => setActiveTab("freshers")}
              >
                <Text style={[styles.tabText, activeTab === "freshers" && styles.activeTabText]}>Freshers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === "coaches" && styles.activeTab]} 
                onPress={() => setActiveTab("coaches")}
              >
                <Text style={[styles.tabText, activeTab === "coaches" && styles.activeTabText]}>Coaches</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      <FlatList 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        data={filteredUsers}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDirectory(1); }} tintColor="#1A2B4A" />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="person.crop.circle.badge.xmark" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#1A2B4A" style={{ marginVertical: 16 }} />
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay((index % 10) * 50).duration(400)}>
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => router.push(`/user/${item.id}` as any)}
            >
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A2B4A' }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                    {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.major}>{item.major || "Undeclared Major"}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: item.type === "peer_coach" ? "#E0E7FF" : "#F3F4F6" }]}>
                <Text style={[styles.roleText, { color: item.type === "peer_coach" ? "#4338CA" : "#4B5563" }]}>
                  {item.type === "peer_coach" ? "Coach" : "Fresher"}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#D1D5DB" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  header: { fontSize: 32, fontWeight: "900", color: "#1A2B4A", letterSpacing: -1 },
  
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", marginHorizontal: 20, paddingHorizontal: 16, height: 48, borderRadius: 24, marginBottom: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }) },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: "#1A2B4A" },
  
  tabContainer: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#E5E7EB", padding: 4, borderRadius: 12, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#FFFFFF", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 2 } }) },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#1A2B4A", fontWeight: "700" },
  
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 60, gap: 12 },
  
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 } }) },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F3F4F6", marginRight: 16 },
  info: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 2 },
  major: { fontSize: 13, color: "#6B7280" },
  
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#6B7280", fontWeight: "600" },
});
