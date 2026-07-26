/* eslint-disable react-hooks/exhaustive-deps */
import { useRouter , Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
  FlatList,
  TextInput
} from "react-native"; 
import globalStyles from '../../styles';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest, API_URL } from "@/lib/api";
import { hasRole } from "@/lib/permissions";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PostCard } from "@/components/dashboard/PostCard";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
// import AsyncStorage from "@react-native-async-storage/async-storage";

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

// New Types for DB integration
type CoachAssignment = { id: string; peer_coach_id: string; coach_name: string; avatar_url: string | null; };
type BuddyPairing = { id: string; buddy_id: string; buddy_name: string; avatar_url: string | null; };
type AssignedFresher = { id: string; fresher_id: string; fresher_name: string; avatar_url: string | null; };
type Group = { id: string; name: string; image_url: string | null; isLeader: boolean; member_count?: number; category?: string; };
type Session = { id: string; title: string; session_date?: string; start_time?: string; status: string; provider_id?: string; date?: string; scheduled_at?: string; };
type AdminStats = { 
  unassigned_freshers?: number; 
  total_freshers?: number;
  upcoming_sessions_count?: number;
  completed_mandatory_sessions?: number;
  active_coaches?: number;
};

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

function NotificationBell() {
  const router = useRouter();
  const { session } = useAuth();
  
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${session?.accessToken}` };
      return apiRequest<{ count: number }>("/notifications/unread-count", { headers });
    },
    enabled: !!session?.accessToken,
    refetchInterval: 60000, // 60 seconds polling
  });
  
  const unreadCount = unreadData?.count || 0;

  return (
    <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications")}>
      <IconSymbol name="bell.fill" size={22} color="#1A2B4A" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Role Checks
  const userClassYear = Number(session?.user?.classYear || session?.user?.studentProfile?.graduationYear);
  const { isUserFresher } = require("@/lib/fresherUtils");
  const isFresher = isUserFresher(userClassYear);
  
  const roles = session?.user.roles || [];
  
  const isPeerCoach = hasRole(roles, "peer_coach");
  const isPeerCounsellor = hasRole(roles, "peer_counsellor");
  const isCounsellor = hasRole(roles, "counsellor");
  const isClubLead = hasRole(roles, "club_lead");
  const isAdmin = hasRole(roles, "admin");
  const isCoachAdmin = hasRole(roles, "coach_admin") || isAdmin;
  const isStaff = hasRole(roles, "staff") || hasRole(roles, "faculty");
  const isAdvisor = hasRole(roles, "advisor");
  const isStudentLeader = hasRole(roles, "student_leader");
  
  const canPostFromHome = isAdvisor || isCounsellor || isCoachAdmin || isAdmin || isStudentLeader || isPeerCoach;
  
  const isContinuingStudent = !isFresher && !isStaff && !isCoachAdmin && !isAdmin && !isPeerCoach && !isPeerCounsellor && !isClubLead && !isAdvisor && !isCounsellor && !isStudentLeader;

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
    staleTime: 1000 * 60 * 5,
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
    ]);
    setRefreshing(false);
  };

  const myGroups: Group[] = dashboardData?.groups || [];
  const assignedCoaches = dashboardData?.fresherData?.assignedCoaches || [];
  const assignedBuddy = dashboardData?.fresherData?.assignedBuddy || null;
  const assignedFreshers: AssignedFresher[] = dashboardData?.coachData?.assignedFreshers || [];
  const upcomingSessions = dashboardData?.sessions?.upcoming || [];
  const overdueSessions = dashboardData?.sessions?.overdue || [];
  const adminStats = dashboardData?.adminStats || null;
  const advisingData = dashboardData?.advisingStats || null;
  const counsellingData = dashboardData?.counsellingStats || null;

  const isLoading = isLoadingDashboard || isLoadingPosts;

  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";
  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const allowedRoles = ["staff", "faculty", "student_leader", "admin", "club_lead", "advisor", "peer_coach", "coach_admin"];
  const canPost = allowedRoles.some((roleName) => hasRole(session?.user.roles || [], roleName));

  const categories = ["All", "Announcement", "Event", "Alert"];

  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  const myLedClubs = myGroups.filter((g: any) => g.isLeader);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <StatusBar style="dark" />
      <FlatList
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
        {/* Dynamic Personal Greeting Header */}
        <View style={styles.personalHeader}>
          <View style={styles.greetingRow}>
            <Pressable style={styles.headerAvatarLarge} onPress={() => router.push("/profile")}>
              {resolveImageUrl(session?.user.avatarUrl) ? (
                <Image source={{ uri: resolveImageUrl(session?.user.avatarUrl)! }} style={styles.headerAvatarImage} />
              ) : (
                <Text style={styles.headerAvatarLargeText}>{userInitial}</Text>
              )}
            </Pressable>
            <View>
              <Text style={styles.greetingTime}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{firstName}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.push("/search")}>
              <IconSymbol name="magnifyingglass" size={22} color="#1A2B4A" />
            </Pressable>
            <NotificationBell />
          </View>
        </View>

        {/* Personalized "What matters right now" Section */}
        <View style={styles.personalSection}>
          
          {/* FRESHER CARDS */}
          {isFresher && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.premiumDashboardContainer}>
              <Text style={styles.premiumTitle}>Your Support Team</Text>
              
              {(assignedCoaches.length > 0 || assignedBuddy) && (
                <View style={styles.premiumRow}>
                  {assignedCoaches.length > 0 && (
                    <Pressable style={styles.premiumCardActive} onPress={() => router.push("/(tabs)/support")}>
                      {resolveImageUrl(assignedCoaches[0].avatar_url) ? (
                        <Image source={{ uri: resolveImageUrl(assignedCoaches[0].avatar_url)! }} style={[styles.personImage, { width: 48, height: 48, borderRadius: 24, marginBottom: 8 }]} />
                      ) : (
                        <View style={[styles.personImage, styles.personImagePlaceholder, { width: 48, height: 48, borderRadius: 24, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                          <Text style={[styles.personImagePlaceholderText, { color: '#FFF' }]}>{assignedCoaches[0].coach_name.charAt(0)}</Text>
                        </View>
                      )}
                      <Text style={[styles.personName, { color: '#FFF' }]}>{assignedCoaches[0].coach_name.split(' ')[0]}</Text>
                      <Text style={styles.premiumLabelWhiteOp}>Peer Coach</Text>
                    </Pressable>
                  )}
                  
                  {assignedBuddy && (
                    <Pressable style={styles.premiumCardSmall} onPress={() => router.push("/(tabs)/support")}>
                      {resolveImageUrl(assignedBuddy.avatar_url) ? (
                        <Image source={{ uri: resolveImageUrl(assignedBuddy.avatar_url)! }} style={[styles.personImage, { width: 48, height: 48, borderRadius: 24, marginBottom: 8 }]} />
                      ) : (
                        <View style={[styles.personImage, styles.personImagePlaceholder, { width: 48, height: 48, borderRadius: 24, marginBottom: 8, backgroundColor: '#EEF2FF' }]}>
                          <Text style={styles.personImagePlaceholderText}>{assignedBuddy.buddy_name.charAt(0)}</Text>
                        </View>
                      )}
                      <Text style={[styles.personName, { color: '#111827' }]}>{assignedBuddy.buddy_name.split(' ')[0]}</Text>
                      <Text style={styles.premiumLabelDark}>OIPCC Buddy</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {myGroups.length === 0 && (
                <Pressable style={styles.premiumActionBtnLight} onPress={() => router.push("/(tabs)/clubs")}>
                  <Text style={styles.premiumActionTextLight}>Find a community to join</Text>
                  <IconSymbol name="chevron.right" size={16} color="#4F46E5" />
                </Pressable>
              )}
            </Animated.View>
          )}

          {/* CONTINUING STUDENT CARDS (Clubs they are just a member of) */}
          {(isContinuingStudent || isFresher) && myGroups.filter(g => !g.isLeader).length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.cardSectionTitle}>Your Clubs</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                {myGroups.filter(g => !g.isLeader).map(club => (
                  <Pressable key={club.id} style={[styles.joinedClubCard, { width: 280 }]} onPress={() => router.push("/(tabs)/clubs")}>
                    <View style={styles.clubRow}>
                      {resolveImageUrl(club.image_url) ? (
                        <Image source={{uri: resolveImageUrl(club.image_url)!}} style={styles.clubAvatarImage} />
                      ) : (
                        <View style={styles.clubAvatarMock}><Text style={styles.clubAvatarText}>{club.name.charAt(0)}</Text></View>
                      )}
                      <View style={styles.clubInfo}>
                        <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                        <Text style={styles.clubUpdate} numberOfLines={1}>{club.category}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* PEER COACH DASHBOARD */}
          {isPeerCoach && (
            <View style={styles.coachDashboardContainer}>
              <Text style={styles.cardSectionTitle}>Coach Overview</Text>
              
              <View style={styles.coachStatsRow}>
                <Pressable style={styles.coachStatCard} onPress={() => router.push("/(tabs)/my-coaching")}>
                  <View style={styles.statIconBg}>
                    <IconSymbol name="person.3.fill" size={20} color="#4338CA" />
                  </View>
                  <Text style={styles.statValue}>{assignedFreshers.length}</Text>
                  <Text style={styles.statLabel}>Freshers</Text>
                </Pressable>

                <Pressable style={styles.coachStatCard} onPress={() => router.push("/(tabs)/support")}>
                  <View style={[styles.statIconBg, { backgroundColor: '#DEF7EC' }]}>
                    <IconSymbol name="calendar" size={20} color="#059669" />
                  </View>
                  <Text style={styles.statValue}>{upcomingSessions.length}</Text>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </Pressable>
                
                <Pressable style={styles.coachStatCard} onPress={() => router.push("/(tabs)/support")}>
                  <View style={[styles.statIconBg, { backgroundColor: '#FEE2E2' }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#DC2626" />
                  </View>
                  <Text style={[styles.statValue, { color: '#DC2626' }]}>{overdueSessions.length}</Text>
                  <Text style={styles.statLabel}>Overdue</Text>
                </Pressable>
              </View>

              {assignedFreshers.length > 0 && (
                <Pressable style={styles.fresherListPreview} onPress={() => router.push("/(tabs)/my-coaching")}>
                  <Text style={styles.previewTitle}>Recent Freshers</Text>
                  <View style={styles.fresherAvatarsRow}>
                    {assignedFreshers.slice(0, 4).map((fresher, idx) => (
                      <View key={fresher.id} style={[styles.fresherAvatarBubble, { zIndex: 10 - idx, marginLeft: idx > 0 ? -12 : 0 }]}>
                        {resolveImageUrl(fresher.avatar_url) ? (
                          <Image source={{ uri: resolveImageUrl(fresher.avatar_url)! }} style={styles.fresherAvatarImage} />
                        ) : (
                          <Text style={styles.fresherAvatarText}>{fresher.fresher_name.charAt(0)}</Text>
                        )}
                      </View>
                    ))}
                    {assignedFreshers.length > 4 && (
                      <View style={[styles.fresherAvatarBubble, styles.fresherAvatarMore, { zIndex: 5, marginLeft: -12 }]}>
                        <Text style={styles.fresherAvatarMoreText}>+{assignedFreshers.length - 4}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              )}
            </View>
          )}


          {isPeerCounsellor && nextSession && (
            <Pressable style={styles.elevatedCard} onPress={() => router.push("/(tabs)/my-roles")}>
              <View style={styles.elevatedHeader}>
                <Text style={styles.elevatedTitle}>Upcoming sessions</Text>
                <IconSymbol name="calendar" size={18} color="#059669" />
              </View>
              <Text style={styles.elevatedDesc}>
                {nextSession.title || 'Your next session'}: {new Date(nextSession.date || nextSession.session_date || nextSession.scheduled_at || new Date()).toLocaleDateString()} at {new Date(nextSession.date || nextSession.session_date || nextSession.scheduled_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
          )}

          {isClubLead && myLedClubs.map(club => (
            <Pressable key={club.id} style={styles.elevatedCard} onPress={() => router.push("/(tabs)/club-admin")}>
              <View style={styles.elevatedHeader}>
                <Text style={styles.elevatedTitle}>Your club: {club.name}</Text>
                <Link href="/new-post" asChild>
                  <Pressable style={styles.miniPostBtn}>
                    <Text style={styles.miniPostBtnText}>New Post</Text>
                  </Pressable>
                </Link>
              </View>
              <Text style={styles.elevatedDesc}>Manage your club members and announcements</Text>
            </Pressable>
          ))}

           {/* ADVISOR - Daily Agenda & Impact Widget */}
           {isAdvisor && !isCoachAdmin && (
             <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.premiumDashboardContainer}>
               <Text style={styles.premiumTitle}>Quick Overview</Text>
               
               <View style={styles.premiumRow}>
                 <Pressable style={styles.premiumCardActive} onPress={() => router.push("/(tabs)/advising-dashboard")}>
                   <IconSymbol name="calendar" size={24} color="#FFFFFF" />
                   <Text style={styles.premiumValueWhite}>{advisingData?.stats?.today_sessions ?? 0}</Text>
                   <Text style={styles.premiumLabelWhite}>Sessions Today</Text>
                 </Pressable>
                 
                 <View style={styles.premiumCol}>
                   <Pressable style={styles.premiumCardSmall} onPress={() => router.push("/(tabs)/advising-dashboard")}>
                     <Text style={styles.premiumValueDark}>{advisingData?.stats?.this_week_sessions ?? 0}</Text>
                     <Text style={styles.premiumLabelDark}>This Week</Text>
                   </Pressable>
                   <Pressable style={styles.premiumCardSmallRed} onPress={() => router.push("/(tabs)/advising-dashboard")}>
                     <Text style={styles.premiumValueRed}>{advisingData?.stats?.overdue_sessions ?? 0}</Text>
                     <Text style={styles.premiumLabelRed}>Overdue</Text>
                   </Pressable>
                 </View>
               </View>
               
               {advisingData?.upcomingSessions?.[0] && (
                 <Pressable style={styles.premiumNextCard} onPress={() => router.push("/(tabs)/advising-dashboard")}>
                   <View style={styles.premiumNextLeft}>
                     <Text style={styles.premiumNextLabel}>UP NEXT</Text>
                     <Text style={styles.premiumNextStudent}>{advisingData.upcomingSessions[0].student_name}</Text>
                     <Text style={styles.premiumNextTime}>
                       {new Date(advisingData.upcomingSessions[0].date || advisingData.upcomingSessions[0].scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </Text>
                   </View>
                   <View style={styles.premiumNextIcon}>
                     <IconSymbol name="arrow.right" size={20} color="#4F46E5" />
                   </View>
                 </Pressable>
               )}
             </Animated.View>
           )}

           {/* COUNSELLOR - Daily Agenda & Impact Widget */}
           {isCounsellor && (
             <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.premiumDashboardContainer}>
               <Text style={styles.premiumTitle}>Counselling Overview</Text>
               
               <View style={styles.premiumRow}>
                 <Pressable style={[styles.premiumCardActive, { backgroundColor: '#10B981' }]} onPress={() => router.push("/(tabs)/counselling-dashboard")}>
                   <IconSymbol name="calendar" size={24} color="#FFFFFF" />
                   <Text style={styles.premiumValueWhite}>{counsellingData?.stats?.today_sessions ?? 0}</Text>
                   <Text style={styles.premiumLabelWhite}>Sessions Today</Text>
                 </Pressable>
                 
                 <View style={styles.premiumCol}>
                   <Pressable style={styles.premiumCardSmall} onPress={() => router.push("/(tabs)/counselling-dashboard")}>
                     <Text style={styles.premiumValueDark}>{counsellingData?.stats?.this_week_sessions ?? 0}</Text>
                     <Text style={styles.premiumLabelDark}>This Week</Text>
                   </Pressable>
                   <Pressable style={styles.premiumCardSmallRed} onPress={() => router.push("/(tabs)/counselling-dashboard")}>
                     <Text style={styles.premiumValueRed}>{counsellingData?.stats?.overdue_sessions ?? 0}</Text>
                     <Text style={styles.premiumLabelRed}>Overdue</Text>
                   </Pressable>
                 </View>
               </View>
               
               {counsellingData?.upcomingSessions?.[0] && (
                 <Pressable style={styles.premiumNextCard} onPress={() => router.push("/(tabs)/counselling-dashboard")}>
                   <View style={styles.premiumNextLeft}>
                     <Text style={styles.premiumNextLabel}>UP NEXT</Text>
                     <Text style={styles.premiumNextStudent}>{counsellingData.upcomingSessions[0].student_name}</Text>
                     <Text style={styles.premiumNextTime}>
                       {new Date(counsellingData.upcomingSessions[0].date || counsellingData.upcomingSessions[0].scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </Text>
                   </View>
                   <View style={styles.premiumNextIcon}>
                     <IconSymbol name="arrow.right" size={20} color="#10B981" />
                   </View>
                 </Pressable>
               )}
             </Animated.View>
           )}


           {/* COACH ADMIN - Executive Command Center */}
           {isCoachAdmin && !isPeerCoach && !isClubLead && (
             <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.premiumDashboardContainer}>
               <Text style={styles.premiumTitle}>Coach Admin Overview</Text>
               
               <View style={styles.premiumRow}>
                 <Pressable style={styles.premiumCardWarningActive} onPress={() => router.push("/(tabs)/coaching-admin/compliance")}>
                   <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#DC2626" />
                   <Text style={styles.premiumValueWarningLarge}>{adminStats?.needsAttention?.length ?? 0}</Text>
                   <Text style={styles.premiumLabelWarning}>Needs Attention</Text>
                 </Pressable>
                 
                 <View style={styles.premiumCol}>
                   <Pressable style={styles.premiumCardSmall} onPress={() => router.push("/(tabs)/schedule")}>
                     <Text style={styles.premiumValueDark}>{adminStats?.stats?.upcoming_sessions_count ?? 0}</Text>
                     <Text style={styles.premiumLabelDark}>Upcoming Sessions</Text>
                   </Pressable>
                   <Pressable style={styles.premiumCardSmallRed} onPress={() => router.push("/(tabs)/schedule")}>
                     <Text style={styles.premiumValueRed}>{adminStats?.stats?.overdue_sessions_count ?? 0}</Text>
                     <Text style={styles.premiumLabelRed}>Overdue Sessions</Text>
                   </Pressable>
                 </View>
               </View>

               {upcomingSessions?.[0] && (
                 <Pressable style={styles.premiumNextCard} onPress={() => router.push("/(tabs)/schedule")}>
                   <View style={styles.premiumNextLeft}>
                     <Text style={styles.premiumNextLabel}>UP NEXT</Text>
                     <Text style={styles.premiumNextStudent}>{(upcomingSessions[0] as any).student_name}</Text>
                     <Text style={styles.premiumNextTime}>
                       {new Date((upcomingSessions[0] as any).date || (upcomingSessions[0] as any).scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </Text>
                   </View>
                   <View style={styles.premiumNextIcon}>
                     <IconSymbol name="arrow.right" size={20} color="#4F46E5" />
                   </View>
                 </Pressable>
               )}

               <Pressable style={styles.premiumActionBtnLight} onPress={() => router.push("/(tabs)/coaching-admin")}>
                 <Text style={styles.premiumActionTextLight}>Open Dashboard</Text>
                 <IconSymbol name="chevron.right" size={16} color="#4F46E5" />
               </Pressable>
             </Animated.View>
           )}

          {/* QUICK POST SECTION */}
          {canPostFromHome && (
             <View style={[styles.cardsStack, { marginTop: (isCoachAdmin && !isPeerCoach) || isAdvisor ? 0 : 12 }]}>
                <Link href="/new-post" asChild>
                  <Pressable style={styles.quickPostCard}>
                    <IconSymbol name="plus" size={20} color="#4338CA" />
                    <Text style={styles.quickPostText}>Post an announcement</Text>
                  </Pressable>
                </Link>
             </View>
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

          {isLoading && (
            <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 24 }} />
          )}
          
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
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color="#A93C40" style={{ marginVertical: 20 }} />
          ) : null
        }
      />
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },

  // Personal Header
  personalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A93C40",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A93C40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerAvatarLargeText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  greetingTime: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  greetingName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A2B4A",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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

  // Personal Section
  personalSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  cardsStack: {
    gap: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Fresher Cards
  dayCounter: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A93C40",
    marginBottom: 4,
  },
  fresherPeopleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  peopleRow: {
    flexDirection: "row",
    gap: 16,
  },
  personItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 16,
  },
  personImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
  },
  personImagePlaceholder: {
    backgroundColor: "#C7D2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActionText: { fontSize: 14, fontWeight: "700", color: "#4338CA" },

  // --- PREMIUM WIDGET STYLES ---
  premiumDashboardContainer: {
    backgroundColor: "#F4F7FB",
    borderRadius: 24,
    padding: 2,
    marginBottom: 20,
  },
  premiumDashboardDark: {
    backgroundColor: "#0F172A",
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  premiumTitleDark: {
    fontSize: 15,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 20,
  },
  premiumRow: {
    flexDirection: "row",
    gap: 12,
  },
  premiumCol: {
    flex: 1,
    gap: 12,
  },
  premiumCardActive: {
    flex: 1,
    backgroundColor: "#4F46E5",
    borderRadius: 24,
    padding: 20,
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  premiumValueWhite: { fontSize: 32, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1, marginTop: 12, marginBottom: 4 },
  premiumValueWhiteLarge: { fontSize: 44, fontWeight: "900", color: "#FFFFFF", letterSpacing: -2, marginTop: 16, marginBottom: 4 },
  premiumLabelWhite: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  premiumLabelWhiteOp: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  
  premiumCardSmall: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  premiumValueDark: { fontSize: 24, fontWeight: "900", color: "#111827", letterSpacing: -1, marginBottom: 2 },
  premiumLabelDark: { fontSize: 12, fontWeight: "600", color: "#6B7280" },

  premiumCardSmallRed: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  premiumValueRed: { fontSize: 24, fontWeight: "900", color: "#DC2626", letterSpacing: -1, marginBottom: 2 },
  premiumLabelRed: { fontSize: 12, fontWeight: "700", color: "#EF4444" },

  premiumNextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  premiumNextLeft: { flex: 1 },
  premiumNextLabel: { fontSize: 11, fontWeight: "800", color: "#8B5CF6", letterSpacing: 1, marginBottom: 6 },
  premiumNextStudent: { fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 2 },
  premiumNextTime: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  premiumNextIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },

  premiumCardDarkPrimary: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 20,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  premiumCardDarkSecondary: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  premiumCardDarkWarning: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  premiumActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  premiumActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  premiumCardWarningActive: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderRadius: 24,
    padding: 20,
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  premiumValueWarningLarge: { fontSize: 44, fontWeight: "900", color: "#DC2626", letterSpacing: -2, marginTop: 16, marginBottom: 4 },
  premiumLabelWarning: { fontSize: 14, fontWeight: "700", color: "#EF4444" },
  premiumActionBtnLight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0E7FF",
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  premiumActionTextLight: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4F46E5",
  },
  personImagePlaceholderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4338CA",
  },
  personName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  personRole: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  upNextCard: {
    backgroundColor: "#1A2B4A",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upNextLeft: {
    flex: 1,
  },
  upNextLabel: {
    color: "#9BA3AE",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  upNextTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  upNextTime: {
    color: "#D1D5DB",
    fontSize: 14,
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#4B5563",
    borderTopColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  clubNudgeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clubNudgeInfo: {
    flex: 1,
  },
  clubNudgeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  clubNudgeDesc: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  // Continuing Student Cards
  joinedClubCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  clubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  clubAvatarMock: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  clubAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  clubAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#D97706",
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  clubUpdate: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  // Elevated Role Cards
  elevatedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4338CA",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
  },
  elevatedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  elevatedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  elevatedDesc: {
    fontSize: 14,
    color: "#6B7280",
  },
  miniPostBtn: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  miniPostBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A2B4A",
  },

  // Staff Cards
  staffSummaryCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  staffSummaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#991B1B",
    flex: 1,
    marginRight: 16,
  },
  quickPostCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickPostText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2B4A",
  },

  // Feed Section
  feedSection: {
    gap: 16,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  postsList: {
    paddingHorizontal: 20,
    gap: 20,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
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
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
    gap: 12,
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
    marginTop: 12,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  emptyFeedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
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
  coachDashboardContainer: {
    marginBottom: 16,
    gap: 12,
  },
  coachStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coachStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A2B4A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  fresherListPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  fresherAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fresherAvatarBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fresherAvatarImage: {
    width: '100%',
    height: '100%',
  },
  fresherAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  fresherAvatarMore: {
    backgroundColor: '#EEF2FF',
  },
  fresherAvatarMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
});
