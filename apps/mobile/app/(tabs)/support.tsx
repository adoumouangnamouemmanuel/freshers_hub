import { StyleSheet, Text, View, Pressable, ScrollView, Linking, ActivityIndicator, Platform, RefreshControl, Image, TouchableOpacity } from "react-native"; 
import globalStyles from '../../styles';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBar } from "expo-status-bar";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from "@/context/auth-context";
import { apiRequest, API_URL } from "@/lib/api";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
};

import { isCoach, isAdvisor } from "@/lib/permissions";

export default function SupportScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isPeerCoach = session?.user?.roles ? isCoach(session.user.roles) : false;
  const isAdvisorUser = session?.user?.roles ? isAdvisor(session.user.roles) : false;
  
  const currentYear = new Date().getFullYear();
  const userClassYear = Number(session?.user?.classYear || session?.user?.studentProfile?.graduationYear);
  const isFresher = userClassYear === currentYear + 4;

  const [assignedCoach, setAssignedCoach] = useState<any>(null);
  const [buddy, setBuddy] = useState<any>(null);
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSupportData = async () => {
    if (!session?.accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const dashboardRes = await apiRequest<any>("/support/dashboard", { headers }).catch(() => null);

      if (dashboardRes) {
        setAssignedCoach(dashboardRes.assignedCoach || null);
        setBuddy(dashboardRes.buddy || null);
        setCounsellors(dashboardRes.counsellors || []);
        setAdvisors(dashboardRes.advisors || []);
        setSessions(Array.isArray(dashboardRes.sessions) ? dashboardRes.sessions : dashboardRes.sessions?.data || []);
      }
    } catch (err) {
      console.error("Error fetching support data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
  }, [session?.accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSupportData();
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  // Calculate coaching sessions
  const coachingSessions = sessions.filter(s => s.type === "peer_coach" || s.type === "peer_coaching");
  const completedSessions = coachingSessions.filter(s => s.status === "completed").length;
  const totalMandatory = coachingSessions.filter(s => s.is_mandatory).length || 3;
  const completionRate = Math.min((completedSessions / Math.max(totalMandatory, 1)) * 100, 100);

  const renderStaffCard = (staff: any, roleLabel: string, bgColor: string, index: number = 0) => {
    let targetUnitId = 1;
    if (roleLabel === "University Counsellor") targetUnitId = 2;
    else if (roleLabel === "Academic Advisor") targetUnitId = 3;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} key={staff.id} style={styles.staffCard}>
        <View style={styles.staffHeader}>
          {resolveImageUrl(staff.avatar_url) ? (
            <Image source={{ uri: resolveImageUrl(staff.avatar_url)! }} style={styles.staffAvatar} />
          ) : (
            <View style={[styles.staffAvatarPlaceholder, { backgroundColor: bgColor }]}>
              <Text style={styles.staffAvatarText}>{staff.name?.charAt(0) || "S"}</Text>
            </View>
          )}
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{staff.name}</Text>
            <Text style={styles.staffRole}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.staffContactRow}>
          <View style={styles.contactItem}>
            <IconSymbol name="envelope.fill" size={14} color="#6B7280" />
            <Text style={styles.contactText} numberOfLines={1}>{staff.email || "No email"}</Text>
          </View>
          <View style={styles.contactItem}>
            <IconSymbol name="phone.fill" size={14} color="#6B7280" />
            <Text style={styles.contactText}>{staff.phone || "No phone"}</Text>
          </View>
        </View>

        <View style={styles.staffActions}>
          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={[styles.socialBtn, { backgroundColor: "#DCFCE7" }]} 
              onPress={() => handleWhatsApp(staff.phone)}
            >
              <FontAwesome name="whatsapp" size={20} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialBtn, { backgroundColor: "#F3F4F6" }]} 
              onPress={() => handleCall(staff.phone)}
            >
              <IconSymbol name="phone.fill" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.bookBtn} 
            onPress={() => router.push(`/support/schedule-session?userId=${staff.id}&name=${encodeURIComponent(staff.name)}&unitId=${targetUnitId}&role=${encodeURIComponent(roleLabel)}` as any)}
          >
            <Text style={styles.bookBtnText}>Book Session</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerContainer}>
        <SafeAreaView edges={["top"]} style={{ paddingBottom: 0 }} />
        <Text style={styles.greeting}>Support Hub</Text>
        <Text style={styles.header}>Welcome, {firstName}</Text>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A2B4A" />}
      >
        {isFresher && !isPeerCoach && (
          <>
            {/* Peer Coaching */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="people" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Peer Coaching</Text>
            </View>

            {assignedCoach ? (
              <View style={styles.premiumCard}>
                <View style={styles.coachProfile}>
                  {resolveImageUrl(assignedCoach.avatar_url) ? (
                    <Image source={{ uri: resolveImageUrl(assignedCoach.avatar_url)! }} style={styles.largeAvatar} />
                  ) : (
                    <View style={[styles.largeAvatar, styles.avatarPlaceholder, { backgroundColor: "#EFF6FF" }]}>
                      <Text style={[styles.avatarText, { color: "#3B82F6" }]}>{assignedCoach.coach_name?.charAt(0) || "C"}</Text>
                    </View>
                  )}
                  <View style={styles.coachInfo}>
                    <Text style={styles.coachName}>{assignedCoach.coach_name}</Text>
                    <Text style={styles.coachRole}>Assigned Peer Coach</Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeaderRow}>
                    <Text style={styles.progressLabel}>Mandatory Sessions Completed</Text>
                    <Text style={styles.progressValue}>{completedSessions} / {totalMandatory}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${completionRate}%`, backgroundColor: "#3B82F6" }]} />
                  </View>
                </View>

                <View style={styles.staffActions}>
                  <View style={styles.socialRow}>
                    <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#E8FBF0" }]} onPress={() => handleWhatsApp(assignedCoach.phone)}>
                      <FontAwesome name="whatsapp" size={22} color="#25D366" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#F3F4F6" }]} onPress={() => handleCall(assignedCoach.phone)}>
                      <Ionicons name="call" size={20} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/support/schedule-session?userId=${assignedCoach.peer_coach_id}&name=${encodeURIComponent(assignedCoach.coach_name)}` as any)}>
                    <Text style={styles.primaryBtnText}>Book a Session</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="time" size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyCardTitle}>Coach Assignment Pending</Text>
                <Text style={styles.emptyCardDesc}>Your peer coach will be assigned shortly. Check back later.</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.yvonneBtn} 
              onPress={() => router.push(`/support/schedule-session?userId=44444444-4444-4444-4444-444444444444&name=${encodeURIComponent('Coach Yvonne')}` as any)}
            >
              <View style={styles.yvonneBtnContent}>
                <View style={styles.yvonneAvatar}>
                  <Text style={styles.yvonneAvatarText}>Y</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.yvonneName}>Coach Yvonne</Text>
                  <Text style={styles.yvonneRole}>Senior Coach</Text>
                </View>
                <View style={styles.yvonneBookBtn}>
                  <Text style={styles.yvonneBookText}>Book</Text>
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Counselling */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="medkit" size={24} color="#D97706" />
          </View>
          <Text style={styles.sectionTitle}>Counselling</Text>
        </View>
        <Text style={styles.sectionDesc}>Confidential & professional mental health support.</Text>

        <View style={styles.listSection}>
          {counsellors.map((c, idx) => renderStaffCard(c, "University Counsellor", "#FEF3C7", idx))}
          {counsellors.length === 0 && (
             <View style={styles.emptyCard}>
               <Text style={styles.emptyCardDesc}>No counsellors available.</Text>
             </View>
          )}
        </View>

        {/* <TouchableOpacity style={styles.crisisBox} onPress={() => handleCall("+233200000000")}>
          <View style={styles.crisisIcon}>
            <Ionicons name="warning" size={24} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.crisisTitle}>Urgent Crisis Line (24/7)</Text>
            <Text style={styles.crisisSub}>Tap to call emergency services</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DC2626" />
        </TouchableOpacity> */}

        {/* Advising — hidden for advisors (they have their own dashboard) */}
        {!isAdvisorUser && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#E0E7FF" }]}>
                <Ionicons name="library" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.sectionTitle}>Academic Advising</Text>
            </View>
            <Text style={styles.sectionDesc}>Expert guidance on your courses and university policies.</Text>

            <View style={styles.listSection}>
              {advisors.map((a, idx) => renderStaffCard(a, "Academic Advisor", "#E0E7FF", idx))}
              {advisors.length === 0 && (
                 <View style={styles.emptyCard}>
                   <Text style={styles.emptyCardDesc}>No advisors available.</Text>
                 </View>
              )}
            </View>
          </>
        )}

        {isFresher && !isPeerCoach && (
          <>
            {/* Buddy Up */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="earth" size={24} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>Buddy Up (OIPCC)</Text>
            </View>

            {buddy ? (
              <View style={[styles.premiumCard, { borderColor: "#D1FAE5", borderWidth: 1, backgroundColor: "#F0FDF4" }]}>
                <View style={styles.coachProfile}>
                  {resolveImageUrl(buddy.avatar_url) ? (
                    <Image source={{ uri: resolveImageUrl(buddy.avatar_url)! }} style={styles.largeAvatar} />
                  ) : (
                    <View style={[styles.largeAvatar, styles.avatarPlaceholder, { backgroundColor: "#D1FAE5" }]}>
                      <Text style={[styles.avatarText, { color: "#059669" }]}>{buddy.buddy_name?.charAt(0) || "B"}</Text>
                    </View>
                  )}
                  <View style={styles.coachInfo}>
                    <Text style={styles.coachName}>{buddy.buddy_name}</Text>
                    <Text style={styles.coachRole}>Your Assigned Buddy</Text>
                  </View>
                </View>

                <View style={styles.staffActions}>
                  <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#DCFCE7", flex: 1, flexDirection: "row", gap: 8 }]} onPress={() => handleWhatsApp(buddy.phone)}>
                    <FontAwesome name="whatsapp" size={22} color="#25D366" />
                    <Text style={{ fontWeight: "700", color: "#166534" }}>Message Buddy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyCardTitle}>Upcoming Assignment</Text>
                <Text style={styles.emptyCardDesc}>Your OIPCC buddy will be assigned soon to help you navigate campus life!</Text>
              </View>
            )}
          </>
        )}
        
      </ScrollView>

      {/* Floating Action Buttons */}
      <Animated.View entering={SlideInDown.delay(500).duration(500)} style={styles.fabContainer}>
        
        {/* SOS Button (Secondary style, but red) */}
        <Pressable 
          style={({ pressed }) => [styles.fabSecondary, pressed && styles.fabPressed]} 
          onPress={() => handleCall("+233200000000")}
        >
          <Ionicons name="warning" size={24} color="#FFFFFF" />
        </Pressable>

        {/* View Sessions Button (Primary style) */}
        <Pressable 
          style={({ pressed }) => [styles.fabPrimary, pressed && styles.fabPressed]} 
          onPress={() => router.push("/support/sessions" as any)}
        >
          <Ionicons name="list" size={20} color="#FFFFFF" />
          <Text style={styles.fabTextPrimary}>View Sessions</Text>
        </Pressable>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7FB" },
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 }
    }),
    zIndex: 10,
  },
  greeting: { fontSize: 13, fontWeight: "800", color: "#8B5CF6", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  header: { fontSize: 34, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 100, paddingTop: 24 },
  
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  sectionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  sectionDesc: { fontSize: 15, color: "#6B7280", marginTop: -16, marginBottom: 8, paddingLeft: 52 },
  
  premiumCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24 },
      android: { elevation: 4 }
    }),
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.08)",
  },
  
  coachProfile: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  largeAvatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontWeight: "800" },
  coachInfo: { flex: 1 },
  coachName: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  coachRole: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  
  progressSection: { marginBottom: 24, backgroundColor: "#F9FAFB", padding: 16, borderRadius: 16 },
  progressHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  progressLabel: { fontSize: 13, fontWeight: "700", color: "#4B5563" },
  progressValue: { fontSize: 13, fontWeight: "800", color: "#111827" },
  progressBarBg: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  
  staffActions: { flexDirection: "row", gap: 12, alignItems: "center" },
  socialRow: { flexDirection: "row", gap: 8 },
  socialBtn: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primaryBtn: { flex: 1, backgroundColor: "#A93C40", height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  secondaryBtn: { flex: 1, backgroundColor: "#E5E7EB", height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  secondaryBtnText: { color: "#4B5563", fontWeight: "800", fontSize: 15 },
  
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F3F4F6",
    borderStyle: "dashed",
  },
  emptyCardTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 8, textAlign: "center" },
  emptyCardDesc: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  
  yvonneBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#DB2777", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 3 }
    }),
    borderWidth: 1,
    borderColor: "rgba(219,39,119,0.1)",
  },
  yvonneBtnContent: { flexDirection: "row", alignItems: "center", gap: 16 },
  yvonneAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FCE7F3", alignItems: "center", justifyContent: "center" },
  yvonneAvatarText: { fontSize: 18, fontWeight: "800", color: "#DB2777" },
  yvonneName: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 2 },
  yvonneRole: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  yvonneBookBtn: { backgroundColor: "#F3F4F6", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  yvonneBookText: { color: "#4B5563", fontWeight: "700", fontSize: 14 },
  
  listSection: { gap: 16 },
  staffCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#111827", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 24 },
      android: { elevation: 2 }
    }),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  staffHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  staffAvatar: { width: 56, height: 56, borderRadius: 28 },
  staffAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  staffAvatarText: { fontSize: 20, fontWeight: "800", color: "#4B5563" },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  staffRole: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  
  staffContactRow: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 12, gap: 8, marginBottom: 16 },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  contactText: { fontSize: 14, color: "#4B5563", fontWeight: "500", flex: 1 },
  
  bookBtn: { flex: 1, backgroundColor: "#A93C40", height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  bookBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  
  crisisBox: { 
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2", 
    borderWidth: 1, 
    borderColor: "#FCA5A5", 
    borderRadius: 20, 
    padding: 16,
    gap: 16,
    marginTop: 8
  },
  crisisIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  crisisTitle: { fontSize: 15, fontWeight: "800", color: "#B91C1C", marginBottom: 2 },
  crisisSub: { fontSize: 13, color: "#DC2626", fontWeight: "500" },
  fabContainer: {
    position: "absolute",
    bottom: 24, right: 24,
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 12,
  },
  fabPrimary: {
    backgroundColor: "#A93C40",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: "#A93C40", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 8 }
    }),
  },
  fabSecondary: {
    backgroundColor: "#DC2626", // Red for SOS
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    ...Platform.select({
      ios: { shadowColor: "#DC2626", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 8 }
    }),
  },
  fabPressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  fabTextPrimary: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
