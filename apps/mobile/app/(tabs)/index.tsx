import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest } from "@/lib/api";
import { useEffect, useState } from "react";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
};

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { session } = useAuth();
  const [expanded, setExpanded] = useState(false);
  
  const isLong = post.content.length > 120;
  const displayContent = !isLong || expanded ? post.content : post.content.slice(0, 120) + "...";
  const isAlert = post.category.toLowerCase() === "alert";
  const isOwner = session?.user.id === post.authorId || session?.user.roles.some((r: any) => r.name === "admin");

  return (
    <Pressable 
      style={[styles.postCard, isAlert && styles.alertCard]} 
      onPress={() => {
        if (isOwner) {
          router.push({ pathname: "/post/[id]", params: { id: post.id } } as any);
        } else if (isLong) {
          setExpanded(!expanded);
        }
      }}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthorAvatar}>
          <Text style={styles.postAuthorInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>{post.authorName}</Text>
          <Text style={styles.postDate}>
            {new Date(post.createdAt).toLocaleDateString()} • {post.category}
          </Text>
        </View>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>
        {displayContent}
        {isLong && !expanded && <Text style={styles.viewMoreInline}> View more</Text>}
      </Text>
    </Pressable>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const data = await apiRequest<{ posts: Post[] }>("/posts");
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts().finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";
  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";

  const allowedRoles = ["staff", "faculty", "student_leader", "admin", "club_lead"];
  const canPost = session?.user.roles.some((r) => allowedRoles.includes(r.name));

  const categories = ["All", "Announcement", "Event", "Alert"];
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = posts.filter(p => {
    if (activeCategory !== "All" && p.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A93C40" />}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable style={styles.headerAvatar} onPress={() => router.push("/profile")}>
            <Text style={styles.headerAvatarText}>{userInitial}</Text>
          </Pressable>
          <Pressable style={styles.headerSearchContainer} onPress={() => router.push("/search")}>
            <IconSymbol name="magnifyingglass" size={20} color="#9BA3AE" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search campus updates...</Text>
          </Pressable>
        </View>

        {/* Category Filters */}
        <View style={styles.categoryScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
            {categories.map(cat => (
              <Pressable 
                key={cat} 
                style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionTile}
              onPress={() => router.push("/(tabs)/help")}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#A93C4015" }]}>
                <IconSymbol name="heart.text.square.fill" size={24} color="#A93C40" />
              </View>
              <Text style={styles.actionTileText}>Support</Text>
            </Pressable>

            <Pressable 
              style={styles.actionTile}
              onPress={() => router.push("/(tabs)/clubs")}
            >
              <View style={[styles.actionIconBg, { backgroundColor: "#C9933A15" }]}>
                <IconSymbol name="person.2.fill" size={24} color="#C9933A" />
              </View>
              <Text style={styles.actionTileText}>Clubs</Text>
            </Pressable>

            <Pressable style={styles.actionTile}>
              <View style={[styles.actionIconBg, { backgroundColor: "#1A2B4A15" }]}>
                <IconSymbol name="map.fill" size={24} color="#1A2B4A" />
              </View>
              <Text style={styles.actionTileText}>Map</Text>
            </Pressable>
          </View>
        </View>

        {/* Feed Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Campus Updates</Text>
            {canPost && (
              <Link href="/new-post" asChild>
                <Pressable style={styles.createPostBtn}>
                  <IconSymbol name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.createPostBtnText}>New Post</Text>
                </Pressable>
              </Link>
            )}
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 24 }} />
          ) : posts.length === 0 ? (
            <View style={styles.emptyFeedCard}>
              <View style={styles.emptyFeedIcon}>
                <IconSymbol name="newspaper.fill" size={28} color="#9BA3AE" />
              </View>
              <Text style={styles.emptyFeedTitle}>You're all caught up!</Text>
              <Text style={styles.emptyFeedDesc}>
                Announcements and events for your class will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.postsList}>
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 28,
    paddingBottom: 40,
  },

  // Top Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#A93C40",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    borderRadius: 24,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchPlaceholder: {
    color: "#9BA3AE",
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  categoryScrollContainer: {
    marginHorizontal: -20,
    marginTop: 0,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F2F5",
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: "#A93C40",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },

  // Sections
  section: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2B4A",
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A93C40",
    marginBottom: 2,
  },
  // Action Grid
  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTileText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2B4A",
  },

  // Empty Feed & Posts
  emptyFeedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyFeedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyFeedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  emptyFeedDesc: {
    fontSize: 14,
    color: "#5f6874",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  createPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A93C40",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  createPostBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  postsList: {
    gap: 16,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  alertCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  postAuthorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  postAuthorInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  postDate: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2B4A",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  postContent: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 26,
  },
  viewMoreInline: {
    color: "#A93C40",
    fontWeight: "700",
  },
});
