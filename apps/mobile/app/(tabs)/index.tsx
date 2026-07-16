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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest } from "@/lib/api";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
  authorId: string;
  eventId?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventOrganizer?: string;
  dressCode?: string;
  eventCapacity?: number;
  rsvpEnabled?: boolean;
  eventStatus?: string;
  goingCount?: number;
  myRsvp?: string;
};

function PostCard({ post, onUpdate }: { post: Post; onUpdate: () => void }) {
  const router = useRouter();
  const { session } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  
  const isLong = post.content.length > 120;
  const displayContent = !isLong || expanded ? post.content : post.content.slice(0, 120) + "...";
  const isAlert = post.category?.toLowerCase() === "alert";
  const isEvent = post.category?.toLowerCase() === "event" && post.eventId;
  const isOwner = session?.user.id === post.authorId || session?.user.roles.some((r: any) => r.name === "admin");

  const handleRsvp = async (status: string) => {
    if (!session || !post.eventId || isRsvping) return;
    setIsRsvping(true);
    try {
      await apiRequest(`/events/${post.eventId}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ status }),
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to RSVP:", err);
    } finally {
      setIsRsvping(false);
    }
  };

  const formattedEventDate = post.eventDate 
    ? new Date(post.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : "";

  return (
    <Pressable 
      style={[styles.postCard, isAlert && styles.alertCard]} 
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
      <View style={styles.postHeader}>
        <View style={styles.postAuthorAvatar}>
          <Text style={styles.postAuthorInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>{post.authorName}</Text>
          <Text style={styles.postDate}>
            {new Date(post.createdAt).toLocaleDateString()} • {post.category}
            {post.visibility === "targeted" && " • Targeted"}
          </Text>
        </View>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>
        {displayContent}
        {isLong && !expanded && <Text style={styles.viewMoreInline}> View more</Text>}
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
          {!!post.eventOrganizer && (
            <View style={styles.eventDetailsRow}>
              <IconSymbol name="person.fill" size={14} color="#6B7280" />
              <Text style={styles.eventDetailsText}>By {post.eventOrganizer}</Text>
            </View>
          )}
          {!!post.dressCode && (
            <View style={styles.eventDetailsRow}>
              <IconSymbol name="figure.stand" size={14} color="#6B7280" />
              <Text style={styles.eventDetailsText}>Dress code: {post.dressCode}</Text>
            </View>
          )}
          
          <View style={styles.eventFooter}>
            <Text style={styles.attendeeCount}>
              {post.goingCount || 0} attending
            </Text>
            {post.rsvpEnabled && (
              <View style={styles.rsvpActions}>
                <Pressable
                  style={[styles.rsvpBtn, post.myRsvp === "going" && styles.rsvpBtnActive]}
                  onPress={() => handleRsvp(post.myRsvp === "going" ? "declined" : "going")}
                  disabled={isRsvping}
                >
                  <Text style={[styles.rsvpBtnText, post.myRsvp === "going" && styles.rsvpBtnTextActive]}>
                    {post.myRsvp === "going" ? "Going" : "RSVP"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const isCoachAdmin = session?.user.roles.some((r: any) => r.name === "coach_admin" || r.name === "admin");
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Post[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("@welcome_dismissed").then(val => {
      if (val !== "true") {
        setWelcomeDismissed(false);
      }
    });
  }, []);

  const dismissWelcome = async () => {
    setWelcomeDismissed(true);
    await AsyncStorage.setItem("@welcome_dismissed", "true");
  };

  const fetchPosts = async () => {
    try {
      const headers = session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined;
      const data = await apiRequest<{ posts: Post[] }>("/posts", { headers });
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!session?.accessToken) return;
    try {
      const data = await apiRequest<{ unreadCount: number }>("/notifications/unread-count", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchPosts(), fetchUnreadCount()]).finally(() => setIsLoading(false));
  }, [session?.accessToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), fetchUnreadCount()]);
    setRefreshing(false);
  };

  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";
  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";

  const allowedRoles = ["staff", "faculty", "student_leader", "admin", "club_lead"];
  const canPost = session?.user.roles.some((r) => allowedRoles.includes(r.name));

  const categories = ["All", "Announcement", "Event", "Alert"];
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState("list");

  const filteredPosts = posts.filter(p => {
    if (activeCategory !== "All" && p.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 100) }]}
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
          <Pressable style={styles.notificationBtn} onPress={() => router.push("/notifications")}>
            <IconSymbol name="bell.fill" size={24} color="#1A2B4A" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Category Filters */}
        <View style={styles.categoryScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
            {categories.map(cat => (
              <Pressable 
                key={cat} 
                style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                onPress={() => {
                  setActiveCategory(cat);
                  if (cat !== "Event") setViewMode("list");
                }}
              >
                <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Welcome Card for Freshers */}
        {!welcomeDismissed && (
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>Welcome to Ashesi!</Text>
              <Pressable onPress={dismissWelcome} style={styles.welcomeCloseBtn}>
                <IconSymbol name="xmark" size={16} color="#6B7280" />
              </Pressable>
            </View>
            <Text style={styles.welcomeDesc}>
              This is your Fresher Hub. Swipe through the Support tab for coaching and counselling, check the Map to find your way around, and browse Clubs to get involved.
            </Text>
            <Pressable style={styles.welcomeActionBtn} onPress={() => router.push("/(tabs)/support")}>
              <Text style={styles.welcomeActionText}>Explore Support Hub</Text>
            </Pressable>
          </View>
        )}

        {isCoachAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Briefing</Text>
            <View style={styles.actionGrid}>
              <Pressable
                style={styles.actionTile}
                onPress={() => router.push("/(tabs)/coaching-admin/assignments" as any)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: "#E0E7FF" }]}>
                  <IconSymbol name="person.3.fill" size={24} color="#4338CA" />
                </View>
                <Text style={styles.actionTileText}>Assign Coaches</Text>
              </Pressable>

              <Pressable 
                style={styles.actionTile}
                onPress={() => router.push("/(tabs)/schedule" as any)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: "#FEF3C7" }]}>
                  <IconSymbol name="calendar" size={24} color="#D97706" />
                </View>
                <Text style={styles.actionTileText}>Today's Sessions</Text>
              </Pressable>

              <Pressable style={styles.actionTile} onPress={() => router.push("/support/schedule-session" as any)}>
                <View style={[styles.actionIconBg, { backgroundColor: "#D1FAE5" }]}>
                  <IconSymbol name="plus" size={24} color="#059669" />
                </View>
                <Text style={styles.actionTileText}>New Session</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {!isCoachAdmin && (
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
        )}

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
          ) : filteredPosts.length === 0 ? (
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
                <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
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
    marginBottom: 60
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
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    color: "#9BA3AE",
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 8,
    backgroundColor: "#A93C40",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
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
    backgroundColor: "#FFFFFF",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  postsList: {
    gap: 16,
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

  welcomeCard: {
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A2B4A",
    flex: 1,
  },
  welcomeCloseBtn: {
    padding: 4,
    marginLeft: 12,
  },
  welcomeDesc: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  welcomeActionBtn: {
    backgroundColor: "#4338CA",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  welcomeActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  alertCard: {
    backgroundColor: "#FEF2F2",
    shadowColor: "#DC2626",
    shadowOpacity: 0.06,
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
  eventContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
    gap: 8,
  },
  eventDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventDetailsText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  attendeeCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  rsvpActions: {
    flexDirection: "row",
    gap: 8,
  },
  rsvpBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F0F2F5",
  },
  rsvpBtnActive: {
    backgroundColor: "#FEF2F2",
  },
  rsvpBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  rsvpBtnTextActive: {
    color: "#A93C40",
  },
});
