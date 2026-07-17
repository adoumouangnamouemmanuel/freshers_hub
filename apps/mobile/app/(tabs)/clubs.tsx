import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, TextInput, Image, RefreshControl } from "react-native"; 
import globalStyles from '../../styles';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBar } from "expo-status-bar";

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
  const insets = useSafeAreaInsets();
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
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.header}>Clubs & Societies</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search clubs, interests..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
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
                <View style={styles.clubCardOverlay}>
                  <View style={styles.clubCardHeaderRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{club.category || 'General'}</Text>
                    </View>
                    <View style={styles.memberBadge}>
                      <Ionicons name="people" size={14} color="#FFFFFF" />
                      <Text style={styles.memberBadgeText}>{club.memberCount || 0}</Text>
                    </View>
                  </View>
                  <View style={styles.clubCardContent}>
                    <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                    <Text style={styles.clubDesc} numberOfLines={2}>
                      {club.description || "Join this club to discover more about their activities and meet new friends."}
                    </Text>
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
      {/* Floating Action Button (FAB) for Club Feeds */}
      {myClubs.length > 0 && !searchQuery && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 84 }]}>
          <Pressable 
            style={styles.fab}
            onPress={() => router.push('/clubs-feed' as any)}
          >
            <IconSymbol name="newspaper.fill" size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>My Feed</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
  fabContainer: {
    position: 'absolute',
    right: 24,
    zIndex: 999,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A93C40', // Ashesi Maroon
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    shadowColor: '#A93C40',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  screen: { flex: 1, backgroundColor: "#fffaf3" },
  loadingScreen: { flex: 1, backgroundColor: "#fffaf3", justifyContent: "center", alignItems: "center" },
  headerContainer: { paddingHorizontal: 20, paddingBottom: 24, backgroundColor: "#A93C40", borderBottomWidth: 0 },
  header: { fontSize: 28, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5, marginBottom: 16 },
  
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 12, height: 44, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#111827" },
  
  scrollContent: { paddingBottom: 200 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#111827", paddingHorizontal: 20, marginBottom: 16 },
  
  horizontalScroll: { paddingHorizontal: 20, gap: 16 },
  myClubCard: { width: 84, alignItems: "center", gap: 8 },
  myClubImageWrapper: { width: 72, height: 72, borderRadius: 36, overflow: "hidden", borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#1A2B4A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  myClubImage: { width: "100%", height: "100%", backgroundColor: "#F3F4F6" },
  myClubIconPlaceholder: { width: "100%", height: "100%", backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center" },
  myClubInitials: { fontSize: 24, fontWeight: "800", color: "#4338CA" },
  myClubName: { fontSize: 13, fontWeight: "600", color: "#4B5563", textAlign: "center" },
  
  discoverHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 20 },
  
  categoryScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F3F4F6" },
  categoryChipActive: { backgroundColor: "#1A2B4A" },
  categoryText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  categoryTextActive: { color: "#FFFFFF" },
  
  clubsList: { paddingHorizontal: 20, gap: 20 },
  clubCard: { backgroundColor: "#1A2B4A", borderRadius: 24, overflow: "hidden", shadowColor: "#1A2B4A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 6, height: 220 },
  clubCardImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  clubCardImagePlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  clubCardOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", padding: 20, justifyContent: "space-between" },
  clubCardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryBadge: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backdropFilter: "blur(10px)" },
  categoryBadgeText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.5 },
  memberBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  memberBadgeText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  clubCardContent: { gap: 6 },
  clubName: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 },
  clubDesc: { fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 22 },
  
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginTop: 12, marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: "#6B7280", textAlign: "center" }
});
