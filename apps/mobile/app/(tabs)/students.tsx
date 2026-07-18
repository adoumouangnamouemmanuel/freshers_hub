import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, TextInput } from "react-native"; 
import globalStyles from '../../styles';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function StudentsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'freshers', 'coaches'
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDirectory = async () => {
    try {
      const res = await fetch(`${API_URL}/support/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchDirectory();
  }, [token]);

  const filteredUsers = users.filter((u: any) => {
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "freshers" && u.type === "student") || 
      (activeTab === "coaches" && u.type === "peer_coach");
    
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.major?.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesTab && matchesSearch;
  });

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
        <TouchableOpacity 
          style={[styles.tab, activeTab === "all" && styles.activeTab]} 
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
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
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDirectory(); }} tintColor="#1A2B4A" />}
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.crop.circle.badge.xmark" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        ) : (
          filteredUsers.map((item: any, index: number) => (
            <Animated.View key={`${item.id}-${index}`} entering={FadeInDown.delay(index * 50).duration(400)}>
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
          ))
        )}
      </ScrollView>
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
