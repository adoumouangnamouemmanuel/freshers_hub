import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, TextInput, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

type Club = {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  category?: string;
  image_url?: string;
};

export default function ClubsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const fetchData = async () => {
    try {
      const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
      const [allRes, myRes] = await Promise.all([
        apiRequest<{ groups: Club[] }>("/groups", { headers }),
        apiRequest<{ groups: Club[] }>("/groups/my", { headers })
      ]);
      setClubs(allRes.groups || []);
      setMyClubs(myRes.groups || []);
    } catch (err) {
      console.error("Error fetching clubs:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Derive categories from clubs data
  const categories = ["All", ...Array.from(new Set(clubs.map(c => c.category || "General")))];

  // Filter unjoined clubs based on search and category
  let unjoinedClubs = clubs.filter(c => !myClubs.some(mc => mc.id === c.id));
  
  if (activeCategory !== "All") {
    unjoinedClubs = unjoinedClubs.filter(c => (c.category || "General") === activeCategory);
  }
  
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    unjoinedClubs = unjoinedClubs.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.description && c.description.toLowerCase().includes(q))
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Clubs & Societies</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search clubs, interests..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {myClubs.length > 0 && !searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Clubs</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {myClubs.map(club => (
                <Pressable 
                  key={club.id} 
                  style={styles.myClubCard}
                  onPress={() => router.push(`/clubs/${club.id}` as any)}
                >
                  <View style={styles.myClubImageWrapper}>
                    {club.image_url ? (
                      <Image source={{ uri: club.image_url }} style={styles.myClubImage} />
                    ) : (
                      <View style={styles.myClubIconPlaceholder}>
                        <Text style={styles.myClubInitials}>{club.name.substring(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.myClubName} numberOfLines={2}>{club.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.discoverHeaderRow}>
            <Text style={styles.sectionTitle}>Discover</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map(cat => (
              <Pressable 
                key={cat} 
                style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.clubsList}>
            {unjoinedClubs.map(club => (
              <Pressable 
                key={club.id} 
                style={styles.clubCard}
                onPress={() => router.push(`/clubs/${club.id}` as any)}
              >
                {club.image_url ? (
                  <Image source={{ uri: club.image_url }} style={styles.clubCardImage} />
                ) : (
                  <View style={styles.clubCardImagePlaceholder}>
                    <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.clubCardBody}>
                  <View style={styles.clubCardHeaderRow}>
                    <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{club.category || 'General'}</Text>
                    </View>
                  </View>
                  <Text style={styles.clubDesc} numberOfLines={2}>
                    {club.description || "Join this club to discover more about their activities and meet new friends."}
                  </Text>
                  
                  <View style={styles.clubFooter}>
                    <View style={styles.memberCountRow}>
                      <Ionicons name="people" size={16} color="#6B7280" />
                      <Text style={styles.memberCountText}>{club.memberCount || 0} Members</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#1A2B4A" />
                  </View>
                </View>
              </Pressable>
            ))}

            {unjoinedClubs.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Clubs Found</Text>
                <Text style={styles.emptyDesc}>Try adjusting your search or category filter.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingScreen: { flex: 1, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  headerContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  header: { fontSize: 28, fontWeight: "900", color: "#111827", letterSpacing: -0.5, marginBottom: 16 },
  
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#111827" },
  
  scrollContent: { paddingBottom: 100 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#111827", paddingHorizontal: 20, marginBottom: 16 },
  
  horizontalScroll: { paddingHorizontal: 20, gap: 16 },
  myClubCard: { width: 80, alignItems: "center", gap: 8 },
  myClubImageWrapper: { width: 72, height: 72, borderRadius: 36, overflow: "hidden", borderWidth: 2, borderColor: "#E5E7EB" },
  myClubImage: { width: "100%", height: "100%" },
  myClubIconPlaceholder: { width: "100%", height: "100%", backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center" },
  myClubInitials: { fontSize: 24, fontWeight: "800", color: "#4338CA" },
  myClubName: { fontSize: 13, fontWeight: "600", color: "#4B5563", textAlign: "center" },
  
  discoverHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 20 },
  
  categoryScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F3F4F6" },
  categoryChipActive: { backgroundColor: "#1A2B4A" },
  categoryText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  categoryTextActive: { color: "#FFFFFF" },
  
  clubsList: { paddingHorizontal: 20, gap: 16 },
  clubCard: { backgroundColor: "#FFFFFF", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.03)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  clubCardImage: { width: "100%", height: 140 },
  clubCardImagePlaceholder: { width: "100%", height: 140, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  clubCardBody: { padding: 16 },
  clubCardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  clubName: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827", marginRight: 12 },
  categoryBadge: { backgroundColor: "#F3F4F6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: "700", color: "#4B5563", textTransform: "uppercase" },
  clubDesc: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginBottom: 16 },
  clubFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  memberCountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberCountText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginTop: 12, marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: "#6B7280", textAlign: "center" }
});
