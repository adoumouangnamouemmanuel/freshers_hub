import { useRouter, Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import globalStyles from '../../styles';
import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest } from "@/lib/api";
import { hasRole } from "@/lib/permissions";
import { PostCard } from "@/components/dashboard/PostCard";

// New Foundation Components
import { DynamicHeader } from "@/components/homescreen/DynamicHeader";
import { DashboardSkeleton, SkeletonLoader } from "@/components/homescreen/SkeletonLoader";

// Role Components
import { FresherHomeScreen } from "@/components/homescreen/roles/FresherHomeScreen";
import { ContinuingStudentHomeScreen } from "@/components/homescreen/roles/ContinuingStudentHomeScreen";
import { CoachHomeScreen } from "@/components/homescreen/roles/CoachHomeScreen";
import { AdvisorHomeScreen } from "@/components/homescreen/roles/AdvisorHomeScreen";
import { CoachAdminHomeScreen } from "@/components/homescreen/roles/CoachAdminHomeScreen";

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

export default function FeedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isFabExpanded, setIsFabExpanded] = useState(false);

  // Role Checks
  const userClassYear = Number(session?.user?.classYear || session?.user?.studentProfile?.graduationYear);
  const { isUserFresher } = require("@/lib/fresherUtils");
  
  const isFresher = isUserFresher(userClassYear);
  const roles = session?.user.roles || [];
  
  const isPeerCoach = hasRole(roles, "peer_coach");
  const isPeerCounsellor = hasRole(roles, "peer_counsellor");
  const isCounsellor = hasRole(roles, "counsellor");
  const isAdmin = hasRole(roles, "admin");
  const isCoachAdmin = hasRole(roles, "coach_admin") || isAdmin;
  const isAdvisor = hasRole(roles, "advisor");
  const isClubLead = hasRole(roles, "club_lead");
  const isStudentLeader = hasRole(roles, "student_leader");
  
  // A continuing student is anyone who is not a fresher and not staff/faculty/admin/advisor
  const isContinuingStudent = !isFresher && !roles.some(r => {
    const roleName = typeof r === 'string' ? r : r.name;
    return roleName ? ["staff", "faculty", "coach_admin", "admin", "advisor", "counsellor"].includes(roleName) : false;
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: dashboardData, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useQuery({
    queryKey: ['home-dashboard'],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${session?.accessToken}` };
      return apiRequest<any>("/home/dashboard", { headers });
    },
    enabled: !!session?.accessToken,
    // Reduced staleTime to 30 seconds to keep data (like session counts) fresh
    staleTime: 1000 * 30, 
  });

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    refetch: refetchPosts
  } = useInfiniteQuery({
    queryKey: ['posts', debouncedSearchQuery, activeCategory],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      let url = `/posts?page=${pageParam}&limit=15`;
      if (debouncedSearchQuery) url += `&q=${encodeURIComponent(debouncedSearchQuery)}`;
      if (activeCategory !== "All") url += `&category=${encodeURIComponent(activeCategory)}`;

      const headers = { Authorization: `Bearer ${session?.accessToken}` };
      const res = await apiRequest<{ data: Post[]; meta: { totalPages: number } }>(url, { headers });
      return res;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta) return undefined;
      return allPages.length < lastPage.meta.totalPages ? allPages.length + 1 : undefined;
    },
    enabled: !!session?.accessToken,
    staleTime: 1000 * 60 * 5,
  });

  const posts = postsData?.pages.flatMap(page => page.data || []) || [];

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNextPage();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDashboard(),
      refetchPosts(),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    ]);
    setRefreshing(false);
  };

  const isLoading = isLoadingDashboard || isLoadingPosts;
  const categories = ["All", "Announcement", "Event", "Alert"];

  if (isLoading && !dashboardData && !refreshing) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <StatusBar style="dark" />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <StatusBar style="dark" />
      <FlashList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostCard post={item} onUpdate={refetchPosts} />}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 100) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A93C40" />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            <DynamicHeader />

            {/* Role-Based Dashboard Sections */}
            <View style={styles.roleSectionsContainer}>
              {isFresher && (
                <FresherHomeScreen 
                  dashboardData={dashboardData} 
                  myGroups={dashboardData?.groups || []} 
                />
              )}

              {isContinuingStudent && !isFresher && (
                <ContinuingStudentHomeScreen 
                  myGroups={dashboardData?.groups || []} 
                />
              )}

              {isPeerCoach && (
                <CoachHomeScreen 
                  dashboardData={dashboardData} 
                />
              )}

              {isAdvisor && !isCoachAdmin && (
                <AdvisorHomeScreen 
                  dashboardData={dashboardData} 
                />
              )}

              {isCounsellor && (
                <AdvisorHomeScreen 
                  dashboardData={dashboardData} 
                  isCounsellor={true} 
                />
              )}

              {isCoachAdmin && !isPeerCoach && !isClubLead && (
                <CoachAdminHomeScreen 
                  dashboardData={dashboardData} 
                  upcomingSessions={dashboardData?.sessions?.upcoming || []} 
                />
              )}
            </View>

            {/* General Feed Section */}
            <View style={styles.feedSection}>
              <Text style={styles.feedTitle}>Campus Updates</Text>
              
              <View style={styles.searchContainer}>
                <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  returnKeyType="search"
                />
              </View>

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
              
              {!isLoading && posts.length === 0 && (
                <View style={styles.emptyFeedCard}>
                  <View style={styles.emptyFeedIcon}>
                    <IconSymbol name="newspaper.fill" size={28} color="#9BA3AE" />
                  </View>
                  <Text style={styles.emptyFeedTitle}>No posts found</Text>
                  <Text style={styles.emptyFeedDesc}>
                    Try adjusting your search or filters.
                  </Text>
                </View>
              )}
            </View>
          </>
        }
        ListFooterComponent={isLoadingMore ? <SkeletonLoader width="100%" height={200} borderRadius={24} style={{ marginTop: 16 }} /> : null}
      />

      {/* Expandable FAB for Creating Content (For Admins) */}
      {isCoachAdmin && (
        <>
          {isFabExpanded && (
            <Pressable 
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 90 }]} 
              onPress={() => setIsFabExpanded(false)} 
            />
          )}
          
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[styles.fabContainer, { bottom: insets.bottom + 24, zIndex: 100 }]}>
            {isFabExpanded && (
              <View style={styles.fabOptionsContainer}>
                {[
                  { name: "Discussion", icon: "bubble.left.and.bubble.right.fill" },
                  { name: "Alert", icon: "exclamationmark.triangle.fill" },
                  { name: "Announcement", icon: "megaphone.fill" },
                  { name: "Event", icon: "calendar.badge.plus" },
                ].map((option, index) => (
                  <Animated.View key={option.name} entering={FadeInDown.delay(index * 40).duration(200)}>
                    <Pressable
                      style={styles.fabOptionPill}
                      onPress={() => {
                        setIsFabExpanded(false);
                        router.push({ pathname: "/new-post", params: { category: option.name } } as any);
                      }}
                    >
                      <IconSymbol name={option.icon as any} size={18} color="#2F3C5F" />
                      <Text style={styles.fabOptionPillText}>{option.name}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed, isFabExpanded && styles.fabActive]}
              onPress={() => setIsFabExpanded(!isFabExpanded)}
            >
              <IconSymbol name={isFabExpanded ? "xmark" : "plus"} size={24} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
  screen: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  content: {
    paddingBottom: 20,
  },
  roleSectionsContainer: {
    marginTop: 8,
  },
  
  // Feed Section
  feedSection: {
    gap: 16,
    marginTop: 8,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#0A1229",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  categoryScrollContainer: {
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  categoryChipActive: {
    backgroundColor: "#1A2B4A",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  emptyFeedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
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

  // FAB 
  fabContainer: {
    position: "absolute",
    right: 24,
    alignItems: "flex-end",
  },
  fabOptionsContainer: {
    marginBottom: 16,
    gap: 12,
    alignItems: "flex-end",
  },
  fabOptionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4E6FB", 
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 10,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fabOptionPillText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2F3C5F",
  },
  fab: {
    backgroundColor: "#1A2B4A",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: "#DC2626",
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
});
