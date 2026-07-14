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

function SearchResultCard({ post }: { post: Post }) {
  const router = useRouter();
  const { session } = useAuth();
  const [expanded, setExpanded] = useState(false);
  
  const isLong = post.content.length > 80;
  const isOwner = session?.user.id === post.authorId || session?.user.roles.some((r: any) => r.name === "admin");
  const isAlert = post.category.toLowerCase() === "alert";
  const isEvent = post.category.toLowerCase() === "event" && post.eventId;

  const formattedEventDate = post.eventDate 
    ? new Date(post.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : "";

  return (
    <Pressable 
      style={[styles.resultCard, isAlert && styles.alertCard]}
      onPress={() => {
        if (isEvent) {
          router.push({ pathname: "/event/[id]", params: { id: post.eventId } } as any);
        } else if (isOwner) {
          router.push({ pathname: "/post/[id]", params: { id: post.id } } as any);
        } else if (isLong) {
          setExpanded(!expanded);
        }
      }}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultCategory}>{post.category}</Text>
        <Text style={styles.resultDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.resultTitle}>{post.title}</Text>
      <Text style={styles.resultContent} numberOfLines={expanded ? undefined : 2}>
        {post.content}
      </Text>

      {isEvent && (
        <View style={styles.eventContainer}>
          <View style={styles.eventDetailsRow}>
            <IconSymbol name="calendar" size={14} color="#6B7280" />
            <Text style={styles.eventDetailsText}>
              {formattedEventDate} at {post.eventTime?.substring(0, 5)}
            </Text>
          </View>
          {!!post.eventLocation && (
            <View style={styles.eventDetailsRow}>
              <IconSymbol name="mappin.and.ellipse" size={14} color="#6B7280" />
              <Text style={styles.eventDetailsText}>{post.eventLocation}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAllPosts() {
      setIsLoading(true);
      try {
        const data = await apiRequest<{ posts: Post[] }>("/posts");
        setPosts(data.posts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllPosts();
  }, []);

  const filteredPosts = posts.filter(p => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

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
            placeholder="Search campus updates..."
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
        ) : !searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>Find Anything</Text>
            <Text style={styles.emptyStateDesc}>Search for announcements, events, and alerts across campus.</Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateDesc}>We couldn't find anything matching "{searchQuery}"</Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            <Text style={styles.resultsCount}>{filteredPosts.length} results</Text>
            {filteredPosts.map(post => (
              <SearchResultCard key={post.id} post={post} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    gap: 12,
  },
  closeBtn: {
    padding: 8,
    marginLeft: -8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A2B4A",
    height: "100%",
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  emptyStateDesc: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  resultsList: {
    gap: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  alertCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultCategory: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A93C40",
    textTransform: "uppercase",
  },
  resultDate: {
    fontSize: 12,
    color: "#9BA3AE",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 6,
  },
  resultContent: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  eventContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
    gap: 8,
  },
  eventDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventDetailsText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
});
