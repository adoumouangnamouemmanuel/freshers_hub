import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";

export type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
  authorId: string;
  targetGroupName?: string;
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

export type CoachAssignment = { id: string; peer_coach_id: string; coach_name: string; avatar_url: string | null; };
export type BuddyPairing = { id: string; buddy_id: string; buddy_name: string; avatar_url: string | null; };
export type AssignedFresher = { id: string; fresher_id: string; fresher_name: string; avatar_url: string | null; };
export type Group = { id: string; name: string; image_url: string | null; is_leader: boolean; member_count?: number; category?: string; };
export type Session = { id: string; title: string; session_date: string; start_time: string; status: string; };
export type AdminStats = {
  stats: {
    total_freshers: number;
    assigned_freshers: number;
    active_coaches: number;
    completed_mandatory_sessions: number;
    target_mandatory_sessions: number;
    target_freshers_per_coach: number;
    upcoming_sessions_count: number;
    overdue_sessions_count: number;
  };
  needsAttention: Array<{id: string; full_name: string; coach_name: string;}>;
};

export function useDashboardData() {
  const { session } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [assignedCoaches, setAssignedCoaches] = useState<CoachAssignment[]>([]);
  const [assignedBuddy, setAssignedBuddy] = useState<BuddyPairing | null>(null);
  const [assignedFreshers, setAssignedFreshers] = useState<AssignedFresher[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [overdueSessions, setOverdueSessions] = useState<Session[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const currentYear = new Date().getFullYear();
  const userClassYear = Number(session?.user?.classYear || session?.user?.studentProfile?.graduationYear);
  const isFresher = userClassYear === currentYear + 4;
  
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
             
             const now = new Date();
             const overdue = (d || []).filter(s => {
               if (s.status !== 'scheduled' && s.status !== 'pending') return false;
               const sessionDate = new Date(s.session_date || (s as any).date);
               return sessionDate < now;
             });
             setOverdueSessions(overdue);
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

  return {
    posts, unreadCount, isLoading, refreshing,
    assignedCoaches, assignedBuddy, assignedFreshers,
    myGroups, upcomingSessions, overdueSessions, adminStats,
    isFresher, isPeerCoach, isPeerCounsellor, isClubLead,
    isAdmin, isCoachAdmin, isStaff, isContinuingStudent,
    handleRefresh, fetchData
  };
}
