import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  TextInput, 
  ScrollView,
  ActivityIndicator 
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { DIRECTORY } from "@/lib/mock-data";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  authorName: string;
  authorId: string;
  eventId?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
};

type Group = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export default function SearchScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFaqLoading, setIsFaqLoading] = useState(false);

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      try {
        const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
        const [postsRes, groupsRes] = await Promise.all([
          apiRequest<{ posts: Post[] }>("/posts", { headers }),
          apiRequest<{ groups: Group[] }>("/groups", { headers })
        ]);
        setPosts(postsRes.posts || []);
        setGroups(groupsRes.groups || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFaqs([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsFaqLoading(true);
      try {
        const data = await apiRequest<{results: FAQ[]}>(`/faqs/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setFaqs(data.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsFaqLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const q = searchQuery.toLowerCase().trim();
  
  const filteredPosts = q ? posts.filter(p => p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q)) : [];
  const filteredGroups = q ? groups.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)) : [];
  const filteredLocations = q ? DIRECTORY.filter(d => 
    d.name?.toLowerCase().includes(q) || 
    d.shortName?.toLowerCase().includes(q) || 
    d.category?.toLowerCase().includes(q) ||
    d.building?.toLowerCase().includes(q)
  ) : [];

  const hasResults = filteredPosts.length > 0 || filteredGroups.length > 0 || filteredLocations.length > 0 || faqs.length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#9BA3AE" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, map, clubs, FAQs..."
            placeholderTextColor="#9BA3AE"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#9BA3AE" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 40 }} />
        ) : !q ? (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>Global Search</Text>
            <Text style={styles.emptyStateDesc}>Search across campus updates, map locations, clubs, and FAQs.</Text>
          </View>
        ) : !hasResults && !isFaqLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateDesc}>We couldn't find anything matching "{searchQuery}"</Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            
            {filteredLocations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Map Locations</Text>
                {filteredLocations.slice(0, 3).map(loc => (
                  <Pressable key={loc.id} style={styles.resultCard} onPress={() => router.push({ pathname: "/(tabs)/map", params: { focusId: loc.id } })}>
                    <View style={styles.row}>
                      <IconSymbol name="map.fill" size={20} color="#A93C40" />
                      <View style={styles.flex1}>
                        <Text style={styles.resultTitle}>{loc.name}</Text>
                        <Text style={styles.resultSub}>{loc.category.toUpperCase()} • {loc.building || "Campus"}</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color="#C4C8D0" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {filteredGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Clubs & Societies</Text>
                {filteredGroups.slice(0, 3).map(club => (
                  <Pressable key={club.id} style={styles.resultCard} onPress={() => router.push("/(tabs)/clubs")}>
                    <View style={styles.row}>
                      <IconSymbol name="person.3.fill" size={20} color="#4338CA" />
                      <View style={styles.flex1}>
                        <Text style={styles.resultTitle}>{club.name}</Text>
                        <Text style={styles.resultSub}>{club.category} • Club</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color="#C4C8D0" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {faqs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>FAQs</Text>
                {faqs.map(faq => (
                  <View key={faq.id} style={styles.resultCard}>
                    <Text style={styles.resultSub}>{faq.category.toUpperCase()}</Text>
                    <Text style={styles.resultTitle}>{faq.question}</Text>
                    <Text style={styles.resultContent}>{faq.answer}</Text>
                  </View>
                ))}
              </View>
            )}

            {filteredPosts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posts & Events</Text>
                {filteredPosts.slice(0, 5).map(post => {
                  const isEvent = post.category?.toLowerCase() === "event" && post.eventId;
                  const isAlert = post.category?.toLowerCase() === "alert";
                  return (
                    <Pressable 
                      key={post.id}
                      style={[styles.resultCard, isAlert && styles.alertCard]}
                      onPress={() => {
                        if (isEvent) {
                          router.push({ pathname: "/event/[id]", params: { id: post.eventId } } as any);
                        } else {
                          router.push({ pathname: "/post/[id]", params: { id: post.id } } as any);
                        }
                      }}
                    >
                      <View style={styles.resultHeader}>
                        <Text style={[styles.resultCategory, isAlert && { color: "#DC2626" }]}>{post.category}</Text>
                        <Text style={styles.resultDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.resultTitle}>{post.title}</Text>
                      <Text style={styles.resultContent} numberOfLines={2}>{post.content}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {isFaqLoading && (
              <ActivityIndicator size="small" color="#A93C40" />
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F0F2F5", gap: 12,
  },
  closeBtn: { padding: 8, marginLeft: -8 },
  searchContainer: {
    flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6",
    borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#1A2B4A", height: "100%" },
  content: { padding: 20, flexGrow: 1 },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 80, gap: 12 },
  emptyStateTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4A" },
  emptyStateDesc: { fontSize: 15, color: "#6B7280", textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },
  resultsList: { gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1A2B4A", marginBottom: 4 },
  resultCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1,
    borderColor: "#F0F2F5", shadowColor: "#1A2B4A", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  alertCard: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex1: { flex: 1 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultCategory: { fontSize: 12, fontWeight: "700", color: "#A93C40", textTransform: "uppercase" },
  resultDate: { fontSize: 12, color: "#9BA3AE" },
  resultTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4A", marginBottom: 4 },
  resultSub: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 4 },
  resultContent: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
});
