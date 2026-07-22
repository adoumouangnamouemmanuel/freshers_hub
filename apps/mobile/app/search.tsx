import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  Image
} from "react-native"; 
import globalStyles from '../styles';
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  author_name: string;
  eventId?: string;
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

type Location = {
  id: string;
  name: string;
  short_name: string;
  category: string;
  building: string;
};

type UserResult = {
  id: string;
  name: string;
  avatar_url: string;
  major: string;
  roles: string[];
};

export default function SearchScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPosts([]);
      setGroups([]);
      setFaqs([]);
      setLocations([]);
      setUsers([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
        const data = await apiRequest<{ results: any }>(`/search?q=${encodeURIComponent(searchQuery.trim())}`, { headers });
        setPosts(data.results.posts || []);
        setGroups(data.results.groups || []);
        setFaqs(data.results.faqs || []);
        setLocations(data.results.locations || []);
        setUsers(data.results.users || []);
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const q = searchQuery.trim();
  const hasResults = posts.length > 0 || groups.length > 0 || faqs.length > 0 || locations.length > 0 || users.length > 0;

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
        {!q ? (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>Global Search</Text>
            <Text style={styles.emptyStateDesc}>Search across campus updates, map locations, clubs, and FAQs.</Text>
          </View>
        ) : !hasResults && !isSearching ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateDesc}>We couldn&apos;t find anything matching &quot;{searchQuery}&quot;</Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            
            {users.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>People Directory</Text>
                {users.slice(0, 3).map(user => (
                  <Pressable key={user.id} style={styles.resultCard} onPress={() => router.push({ pathname: "/user/[id]", params: { id: user.id } } as any)}>
                    <View style={styles.row}>
                      <Image 
                        source={{ uri: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1A2B4A&color=fff` }} 
                        style={styles.avatar} 
                      />
                      <View style={styles.flex1}>
                        <Text style={styles.resultTitle}>{user.name}</Text>
                        <Text style={styles.resultSub}>{user.roles.includes('student') ? user.major : user.roles.join(', ').replace('_', ' ')}</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color="#C4C8D0" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {locations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Map Locations</Text>
                {locations.slice(0, 3).map(loc => (
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

            {groups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Clubs & Societies</Text>
                {groups.slice(0, 3).map(group => (
                  <Pressable key={group.id} style={styles.resultCard} onPress={() => router.push("/(tabs)/clubs")}>
                    <View style={styles.row}>
                      <IconSymbol name="person.3.fill" size={20} color="#4338CA" />
                      <View style={styles.flex1}>
                        <Text style={styles.resultTitle}>{group.name}</Text>
                        <Text style={styles.resultSub}>{group.category} • Club</Text>
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

            {posts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posts & Events</Text>
                {posts.slice(0, 5).map(post => {
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
                        <Text style={styles.resultDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.resultTitle}>{post.title}</Text>
                      <Text style={styles.resultContent} numberOfLines={2}>{post.content}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {isSearching && (
              <ActivityIndicator size="small" color="#A93C40" />
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
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
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E5E7EB" },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultCategory: { fontSize: 12, fontWeight: "700", color: "#A93C40", textTransform: "uppercase" },
  resultDate: { fontSize: 12, color: "#9BA3AE" },
  resultTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4A", marginBottom: 4 },
  resultSub: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 4, textTransform: "capitalize" },
  resultContent: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
});
