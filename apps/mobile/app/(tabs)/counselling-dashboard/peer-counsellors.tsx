import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function PeerCounsellorsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPeerCounsellors = async () => {
    try {
      const res = await fetch(`${API_URL}/support/counselling/peer-counsellors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCounsellors(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchPeerCounsellors();
  }, [token]);

  const filteredCounsellors = counsellors.filter((u: any) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
        <Text style={styles.header}>Peer Counsellors</Text>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
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

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPeerCounsellors(); }} tintColor="#4F46E5" />}
      >
        {filteredCounsellors.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="person.crop.circle.badge.xmark" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No peer counsellors found.</Text>
          </View>
        ) : (
          filteredCounsellors.map((item: any, index: number) => (
            <Animated.View key={`${item.id}-${index}`} entering={FadeInDown.delay(index * 50).duration(400)}>
              <TouchableOpacity 
                style={styles.userCard}
                onPress={() => router.push(`/user/${item.id}` as any)}
              >
                <Image 
                  source={{ uri: item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random` }} 
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userDetail}>{item.email}</Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleText}>Peer Counsellor</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: { padding: 20, paddingBottom: 10, backgroundColor: "#FFFFFF" },
  header: { fontSize: 24, fontWeight: "700", color: "#111827" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 20, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#111827" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#F3F4F6" },
  userInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  userDetail: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  roleTag: { alignSelf: "flex-start", backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  roleText: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
});
