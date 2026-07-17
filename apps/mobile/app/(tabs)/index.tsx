import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet
} from "react-native"; 
import globalStyles from '../../styles';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest } from "@/lib/api";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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

// New Types for DB integration
type CoachAssignment = { id: string; peer_coach_id: string; coach_name: string; avatar_url: string | null; };
type BuddyPairing = { id: string; buddy_id: string; buddy_name: string; avatar_url: string | null; };
type AssignedFresher = { id: string; fresher_id: string; fresher_name: string; avatar_url: string | null; };
type Group = { id: string; name: string; image_url: string | null; is_leader: boolean; member_count?: number; category?: string; };
type Session = { id: string; session_date: string; start_time: string; status: string; };
type AdminStats = { unassigned_freshers?: number; total_freshers?: number; };

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
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Post[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New DB States
  const [assignedCoaches, setAssignedCoaches] = useState<CoachAssignment[]>([]);
  const [assignedBuddy, setAssignedBuddy] = useState<BuddyPairing | null>(null);
  const [assignedFreshers, setAssignedFreshers] = useState<AssignedFresher[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Role Checks
  const currentYear = new Date().getFullYear();
  const isFresher = session?.user.studentProfile?.graduationYear === currentYear + 4;
  
  const roles = session?.user.roles || [];
  const hasRole = (roleName: string) => roles.some((r: any) => r.name === roleName);
  
  const isPeerCoach = hasRole("peer_coach");
  const isPeerCounsellor = hasRole("peer_counsellor");
  const isClubLead = hasRole("club_lead");
  const isAdmin = hasRole("admin");
  const isCoachAdmin = hasRole("coach_admin") || isAdmin;
  const isStaff = hasRole("staff") || hasRole("faculty");
  const isContinuingStudent = !isFresher && !isStaff && !isCoachAdmin && !isAdmin && !isPeerCoach && !isPeerCounsellor && !isClubLead;

  const fetchData = async () => {
    if (!session?.accessToken) return;
    const headers = { Authorization: `Bearer ${session.accessToken}` };

    try {
      const promises: Promise<any>[] = [
        apiRequest<{ posts: Post[] }>("/posts", { headers }).then(d => setPosts(d.posts || [])),
        apiRequest<{ unreadCount: number }>("/notifications/unread-count", { headers }).then(d => setUnreadCount(d.unreadCount || 0))
      ];

      if (isFresher) {
        promises.push(
          apiRequest<CoachAssignment[]>("/support/coaches/assigned", { headers }).then(d => setAssignedCoaches(d || [])).catch(() => {}),
          apiRequest<BuddyPairing>("/support/buddy", { headers }).then(d => setAssignedBuddy(d || null)).catch(() => {})
        );
      }

      if (isPeerCoach) {
        promises.push(
          apiRequest<AssignedFresher[]>("/support/coaches/freshers", { headers }).then(d => setAssignedFreshers(d || [])).catch(() => {})
        );
      }

      if (isContinuingStudent || isClubLead || isFresher) {
        promises.push(
          apiRequest<{groups: Group[]}>("/groups/my", { headers }).then(d => setMyGroups(d.groups || [])).catch(() => {})
        );
      }

      if (isFresher || isPeerCounsellor || isPeerCoach) {
        promises.push(
           apiRequest<Session[]>("/support/sessions", { headers }).then(d => {
             const upcoming = (d || []).filter(s => s.status === 'scheduled' || s.status === 'pending');
             setUpcomingSessions(upcoming);
           }).catch(() => {})
        );
      }

      if (isCoachAdmin) {
        promises.push(
          apiRequest<AdminStats>("/support/admin/dashboard", { headers }).then(d => setAdminStats(d || null)).catch(() => {})
        );
      }

      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";
  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const allowedRoles = ["staff", "faculty", "student_leader", "admin", "club_lead"];
  const canPost = session?.user.roles.some((r) => allowedRoles.includes(r.name));

  const categories = ["All", "Announcement", "Event", "Alert"];
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = posts.filter(p => {
    if (activeCategory !== "All" && p.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    return true;
  });

  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  const myLedClubs = myGroups.filter(g => g.is_leader);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 100) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A93C40" />}
      >
        {/* Dynamic Personal Greeting Header */}
        <View style={styles.personalHeader}>
          <View style={styles.greetingRow}>
            <Pressable style={styles.headerAvatarLarge} onPress={() => router.push("/profile")}>
              <Text style={styles.headerAvatarLargeText}>{userInitial}</Text>
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
            <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications")}>
              <IconSymbol name="bell.fill" size={22} color="#1A2B4A" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Personalized "What matters right now" Section */}
        <View style={styles.personalSection}>
          
          {/* FRESHER CARDS */}
          {isFresher && (
            <View style={styles.cardsStack}>
              
              {(assignedCoaches.length > 0 || assignedBuddy) && (
                <View style={styles.fresherPeopleCard}>
                  <Text style={styles.cardSectionTitle}>Your Support Team</Text>
                  <View style={styles.peopleRow}>
                    {assignedCoaches.length > 0 && (
                      <Pressable style={styles.personItem} onPress={() => router.push("/(tabs)/support")}>
                        {assignedCoaches[0].avatar_url ? (
                          <Image source={{ uri: assignedCoaches[0].avatar_url }} style={styles.personImage} />
                        ) : (
                          <View style={[styles.personImage, styles.personImagePlaceholder]}>
                            <Text style={styles.personImagePlaceholderText}>{assignedCoaches[0].coach_name.charAt(0)}</Text>
                          </View>
                        )}
                        <Text style={styles.personName}>{assignedCoaches[0].coach_name.split(' ')[0]}</Text>
                        <Text style={styles.personRole}>Peer Coach</Text>
                      </Pressable>
                    )}
                    
                    {assignedBuddy && (
                      <Pressable style={styles.personItem} onPress={() => router.push("/(tabs)/support")}>
                        {assignedBuddy.avatar_url ? (
                          <Image source={{ uri: assignedBuddy.avatar_url }} style={styles.personImage} />
                        ) : (
                          <View style={[styles.personImage, styles.personImagePlaceholder]}>
                            <Text style={styles.personImagePlaceholderText}>{assignedBuddy.buddy_name.charAt(0)}</Text>
                          </View>
                        )}
                        <Text style={styles.personName}>{assignedBuddy.buddy_name.split(' ')[0]}</Text>
                        <Text style={styles.personRole}>Buddy</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {nextSession && (
                <Pressable style={styles.upNextCard} onPress={() => router.push("/(tabs)/support")}>
                  <View style={styles.upNextLeft}>
                    <Text style={styles.upNextLabel}>Up next</Text>
                    <Text style={styles.upNextTitle}>Session</Text>
                    <Text style={styles.upNextTime}>
                      {new Date(nextSession.session_date).toLocaleDateString()} at {nextSession.start_time.substring(0, 5)}
                    </Text>
                  </View>
                  <View style={styles.progressRing}>
                    <IconSymbol name="calendar" size={20} color="#FFFFFF" />
                  </View>
                </Pressable>
              )}

              {myGroups.length === 0 && (
                <Pressable style={styles.clubNudgeCard} onPress={() => router.push("/(tabs)/clubs")}>
                  <View style={styles.clubNudgeInfo}>
                    <Text style={styles.clubNudgeTitle}>Looking for a community?</Text>
                    <Text style={styles.clubNudgeDesc}>Explore 40+ clubs on campus.</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="#9BA3AE" />
                </Pressable>
              )}
            </View>
          )}

          {/* CONTINUING STUDENT CARDS (Clubs they are just a member of) */}
          {(isContinuingStudent || isFresher) && myGroups.filter(g => !g.is_leader).length > 0 && (
            <View style={styles.cardsStack}>
              <Text style={[styles.cardSectionTitle, { marginTop: 12 }]}>Your Clubs</Text>
              {myGroups.filter(g => !g.is_leader).map(club => (
                <Pressable key={club.id} style={styles.joinedClubCard} onPress={() => router.push("/(tabs)/clubs")}>
                  <View style={styles.clubRow}>
                    {club.image_url ? (
                      <Image source={{uri: club.image_url}} style={styles.clubAvatarImage} />
                    ) : (
                      <View style={styles.clubAvatarMock}><Text style={styles.clubAvatarText}>{club.name.charAt(0)}</Text></View>
                    )}
                    <View style={styles.clubInfo}>
                      <Text style={styles.clubName}>{club.name}</Text>
                      <Text style={styles.clubUpdate}>{club.category}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
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
                  <Text style={styles.statLabel}>Sessions</Text>
                </Pressable>
              </View>

              {assignedFreshers.length > 0 && (
                <Pressable style={styles.fresherListPreview} onPress={() => router.push("/(tabs)/my-coaching")}>
                  <Text style={styles.previewTitle}>Recent Freshers</Text>
                  <View style={styles.fresherAvatarsRow}>
                    {assignedFreshers.slice(0, 4).map((fresher, idx) => (
                      <View key={fresher.id} style={[styles.fresherAvatarBubble, { zIndex: 10 - idx, marginLeft: idx > 0 ? -12 : 0 }]}>
                        {fresher.avatar_url ? (
                          <Image source={{ uri: fresher.avatar_url }} style={styles.fresherAvatarImage} />
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
                Your next session: {new Date(nextSession.session_date).toLocaleDateString()} at {nextSession.start_time.substring(0, 5)}
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

          {/* COACH ADMIN */}
          {isCoachAdmin && !isPeerCoach && !isClubLead && adminStats && (
             <View style={styles.cardsStack}>
                <Pressable style={styles.staffSummaryCard} onPress={() => router.push("/(tabs)/coaching-admin")}>
                  <Text style={styles.staffSummaryText}>
                    {adminStats.unassigned_freshers && adminStats.unassigned_freshers > 0 
                      ? `${adminStats.unassigned_freshers} freshers are waiting to be assigned.` 
                      : `All ${adminStats.total_freshers || 0} freshers are assigned!`}
                  </Text>
                  <IconSymbol name="arrow.right" size={16} color="#A93C40" />
                </Pressable>
             </View>
          )}

          {/* STAFF / FACULTY / ADMIN (Quick Post) */}
          {(isCoachAdmin || isStaff) && canPost && !isPeerCoach && !isClubLead && (
             <View style={[styles.cardsStack, { marginTop: isCoachAdmin ? 0 : 12 }]}>
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

          {isLoading ? (
            <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 24 }} />
          ) : filteredPosts.length === 0 ? (
            <View style={styles.emptyFeedCard}>
              <View style={styles.emptyFeedIcon}>
                <IconSymbol name="newspaper.fill" size={28} color="#9BA3AE" />
              </View>
              <Text style={styles.emptyFeedTitle}>You're all caught up!</Text>
              <Text style={styles.emptyFeedDesc}>
                Announcements and events will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.postsList}>
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={fetchData} />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
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
    paddingBottom: 40,
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
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4A",
    paddingHorizontal: 20,
    letterSpacing: -0.5,
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
