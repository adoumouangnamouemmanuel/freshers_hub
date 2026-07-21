import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Linking, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const token = session?.accessToken;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [notifying, setNotifying] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/support/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchProfile();
  }, [id, token]);

  const handleNotify = () => {
    setNotifying(true);
    setTimeout(() => {
      Alert.alert("Success", `A nudge has been sent to ${profile?.full_name}.`);
      setNotifying(false);
    }, 800);
  };

  const openApp = (type: "phone" | "email" | "whatsapp") => {
    if (!profile) return;
    try {
      if (type === "phone" && profile.phone) {
        Linking.openURL(`tel:${profile.phone}`);
      } else if (type === "email" && profile.email) {
        Linking.openURL(`mailto:${profile.email}`);
      } else if (type === "whatsapp" && profile.phone) {
        Linking.openURL(`whatsapp://send?phone=${profile.phone}`);
      } else {
        Alert.alert("Not Available", `This user has not provided their ${type} contact.`);
      }
    } catch (error) {
      Alert.alert("Error", `Could not open ${type}. Make sure you have the app installed.`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtnLoading}>
            <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A93C40" />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtnLoading}>
            <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.notFoundText}>User not found</Text>
        </View>
      </View>
    );
  }

  const userInitial = profile.full_name?.charAt(0).toUpperCase() ?? "?";
  const roles = profile.roles || [];
  
  const isCoach = roles.includes("peer_coach");
  const isAdvisorUser = session?.user?.roles?.some((r: any) => r.name === "advisor");
  const assignedFreshers = profile.assigned_freshers || [];
  const assignedCoach = profile.assigned_coach;
  
  const completedSessions = parseInt(
    isCoach ? (profile.completed_sessions_as_provider || 0) : (profile.completed_sessions_as_student || 0)
  );
  
  // A coach's target is 3 sessions per assigned fresher. A fresher's target is simply 3.
  const targetSessions = isCoach ? (assignedFreshers.length * 3) : 3;
  const progressPct = targetSessions > 0 ? Math.min((completedSessions / targetSessions) * 100, 100) : 0;
  
  const reportsFiled = parseInt(profile.reports_filed || 0);

  // Academic Year calculation
  const classYearStr = profile.graduation_year || profile.class_year;
  const currentYear = new Date().getFullYear();
  let academicYear = 0;
  if (classYearStr) {
    const gradYear = parseInt(classYearStr.toString().replace(/\D/g,''), 10);
    if (!isNaN(gradYear)) {
      academicYear = Math.max(1, Math.min(4, 5 - (gradYear - currentYear)));
    }
  }

  const filteredSessions = (profile.recent_sessions || []).filter((s: any) => {
    if (isAdvisorUser) {
      return s.provider_id === session?.user?.id || s.student_id === session?.user?.id;
    }
    return true;
  });

  return (
    <View style={styles.screen}>
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.headerBg, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerName} numberOfLines={1}>{profile.full_name}</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Overlay */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
          
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.majorMeta}>{profile.country || "Unknown"} • {profile.major || "Undeclared"} • '{profile.graduation_year || profile.class_year || "XX"}</Text>
          
          <View style={styles.roleContainer}>
            {roles.map((role: string) => {
              const isCoach = role === "peer_coach";
              return (
                <View key={role} style={[styles.roleBadge, isCoach && styles.roleBadgeCoach]}>
                  <Text style={[styles.roleText, isCoach && styles.roleTextCoach]}>
                    {role.replace("_", " ")}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Quick Contact Actions */}
          <View style={styles.quickActions}>
            <Pressable style={styles.actionCircle} onPress={() => openApp('phone')}>
              <IconSymbol name="phone.fill" size={20} color="#1A2B4A" />
            </Pressable>
            <Pressable style={styles.actionCircle} onPress={() => openApp('email')}>
              <IconSymbol name="envelope.fill" size={20} color="#1A2B4A" />
            </Pressable>
            <Pressable style={[styles.actionCircle, { backgroundColor: "#25D366" }]} onPress={() => openApp('whatsapp')}>
              <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
            </Pressable>
            
            {session?.user?.roles?.some(role => role.name === "peer_coach") && profile.id !== session?.user?.id && (
              <Pressable 
                style={[styles.actionCircle, { backgroundColor: "#1A2B4A", flex: 1, borderRadius: 16, paddingHorizontal: 16 }]} 
                onPress={() => router.push(`/support/schedule-session?userId=${profile.id}&name=${encodeURIComponent(profile.full_name)}&asCoach=true` as any)}
              >
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>Schedule Session</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Sessions Overview Card - Hidden for Advisors */}
        {!isAdvisorUser && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Sessions Overview</Text>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Completed</Text>
                <Text style={styles.overviewValue}>{completedSessions}</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Target</Text>
                <Text style={styles.overviewValue}>{targetSessions}</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: '#A93C40' }]} />
              </View>
              <Text style={styles.progressText}>{progressPct.toFixed(0)}% Completion</Text>
            </View>
          </Animated.View>
        )}

        {roles.includes("peer_coach") && assignedFreshers.length > 0 && (
          <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Assigned Freshers</Text>
            {assignedFreshers.map((fresher: any, idx: number) => {
              const fresherProgressPct = (fresher.sessionsCompleted / fresher.totalAssigned) * 100;
              return (
                <View key={fresher.id}>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIconBox, { backgroundColor: '#F3F4F6' }]}>
                      <IconSymbol name="person.fill" size={16} color="#4B5563" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{fresher.name}</Text>
                      <View style={[styles.progressContainer, { marginTop: 4 }]}>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${fresherProgressPct}%`, backgroundColor: fresher.sessionsCompleted === 0 ? '#EF4444' : fresher.sessionsCompleted < fresher.totalAssigned ? '#F59E0B' : '#10B981' }]} />
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.progressText, { marginLeft: 12 }]}>{fresher.sessionsCompleted}/{fresher.totalAssigned}</Text>
                  </View>
                  {idx < assignedFreshers.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </Animated.View>
        )}

        {!isCoach && assignedCoach && !session?.user?.roles?.some((role: any) => role.name === "peer_coach") && !isAdvisorUser && (
          <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Assigned Peer Coach</Text>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: '#F3F4F6' }]}>
                <IconSymbol name="person.fill" size={16} color="#4B5563" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{assignedCoach.name}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Recent Sessions List */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          {filteredSessions.map((session: any, idx: number) => {
            const isExpanded = expandedSessionId === session.id;
            return (
              <View key={session.id}>
                <Pressable 
                  style={styles.infoRow} 
                  onPress={() => setExpandedSessionId(isExpanded ? null : session.id)}
                >
                  <View style={[styles.infoIconBox, { backgroundColor: 'rgba(201, 147, 58, 0.1)' }]}>
                    <IconSymbol name="calendar" size={16} color="#C9933A" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{session.type}</Text>
                    <Text style={styles.infoValue}>{session.date}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{session.status}</Text>
                  </View>
                </Pressable>
                
                {isExpanded && (
                  <View style={styles.expandedSessionContent}>
                    <Text style={styles.sessionDetailText}><Text style={{fontWeight: '700'}}>With:</Text> {session.with}</Text>
                    <Text style={styles.sessionDetailText}><Text style={{fontWeight: '700'}}>Location:</Text> {session.location}</Text>
                    
                    {session.status === 'completed' && session.provider_id === session?.user?.id && !session.has_report ? (
                      <Pressable 
                        style={styles.submitReportBtn}
                        onPress={() => router.push(`/my-coaching/report?sessionId=${session.id}&fresherName=${encodeURIComponent(profile.full_name)}` as any)}
                      >
                        <Text style={styles.submitReportBtnText}>Submit Report</Text>
                      </Pressable>
                    ) : session.report ? (
                      <View style={styles.sessionReportBox}>
                        <Text style={styles.sessionReportTitle}>Topic Discussed</Text>
                        <Text style={styles.sessionReportText}>{session.report.topic}</Text>
                        
                        <Text style={[styles.sessionReportTitle, { marginTop: 8 }]}>Action Items</Text>
                        <Text style={styles.sessionReportText}>{session.report.actions}</Text>

                        <Text style={[styles.sessionReportTitle, { marginTop: 8 }]}>Student Mood/Status</Text>
                        <Text style={styles.sessionReportText}>{session.report.mood}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
                {idx < filteredSessions.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
          {filteredSessions.length === 0 && (
            <Text style={{color: '#6B7280', fontSize: 13, marginTop: 8}}>No recent sessions available.</Text>
          )}
        </Animated.View>

        {/* Academic Details - Stunning Progress */}
        {isAdvisorUser && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.detailsCard, { padding: 0, overflow: 'hidden' }]}>
          <View style={{ backgroundColor: '#1A2B4A', padding: 24 }}>
            <Text style={[styles.cardTitle, { color: '#FFFFFF', marginBottom: 24 }]}>Academic Progress</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>Current Status</Text>
              <Text style={{ color: '#E0E7FF', fontSize: 14, fontWeight: '800' }}>Class of '{classYearStr ? String(classYearStr).slice(-2) : 'XX'}</Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 32 }}>
              {academicYear === 1 ? "Freshman" : academicYear === 2 ? "Sophomore" : academicYear === 3 ? "Junior" : academicYear === 4 ? "Senior" : "Unknown Year"}
            </Text>
            
            {/* Progress Bar Timeline */}
            {academicYear > 0 && (
              <View style={{ position: 'relative', marginTop: 10 }}>
                {/* Background line */}
                <View style={{ position: 'absolute', top: 11, left: 16, right: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                
                {/* Active line */}
                <View style={{ position: 'absolute', top: 11, left: 16, width: `${(academicYear - 1) * 33.33}%`, height: 2, backgroundColor: '#A93C40' }} />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {[1, 2, 3, 4].map((year) => {
                    const isActive = year <= academicYear;
                    const isCurrent = year === academicYear;
                    return (
                      <View key={year} style={{ alignItems: 'center', width: 32 }}>
                        <View style={{ 
                          width: 24, height: 24, borderRadius: 12, 
                          backgroundColor: isActive ? '#A93C40' : '#0F172A',
                          borderWidth: 2, borderColor: isActive ? '#A93C40' : 'rgba(255,255,255,0.2)',
                          alignItems: 'center', justifyContent: 'center',
                          marginBottom: 8,
                          ...(isCurrent ? { shadowColor: '#A93C40', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 } : {})
                        }}>
                          {isActive && <IconSymbol name="checkmark" size={12} color="#FFFFFF" />}
                        </View>
                        <Text style={{ color: isCurrent ? '#FFFFFF' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: isCurrent ? '800' : '600' }}>
                          Y{year}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
          
          <View style={{ backgroundColor: '#FFFFFF', padding: 24 }}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <IconSymbol name="person.text.rectangle.fill" size={16} color="#6B7280" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Student ID</Text>
                <Text style={styles.infoValue}>{profile.school_id || "Not Provided"}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <IconSymbol name="building.columns.fill" size={16} color="#6B7280" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Major / Program</Text>
                <Text style={styles.infoValue}>{profile.major || "Undeclared"}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
        )}

        {/* Contact Details */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Contact Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <IconSymbol name="phone.fill" size={16} color="#6B7280" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{profile.phone || "Not Provided"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <IconSymbol name="envelope.fill" size={16} color="#6B7280" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{profile.email || "Not Provided"}</Text>
            </View>
          </View>
        </Animated.View>

      </ScrollView>

      {/* Floating Action Buttons */}
      <Animated.View entering={SlideInDown.delay(500).duration(500)} style={[styles.fabContainer, { paddingBottom: insets.bottom || 24 }]}>
        <Pressable 
          style={({ pressed }) => [styles.fabSecondary, pressed && styles.fabPressed]} 
          onPress={handleNotify}
          disabled={notifying}
        >
          {notifying ? (
            <ActivityIndicator color="#A93C40" />
          ) : (
            <>
              <IconSymbol name="bell.fill" size={20} color="#A93C40" />
            </>
          )}
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [styles.fabPrimary, pressed && styles.fabPressed]} 
          onPress={() => router.push(`/support/schedule-session?userId=${id}&name=${encodeURIComponent(profile.full_name)}` as any)}
        >
          <IconSymbol name="calendar" size={20} color="#FFFFFF" />
          <Text style={styles.fabTextPrimary}>Schedule Session</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { fontSize: 16, color: "#6B7280", fontWeight: "600" },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  closeBtnLoading: { padding: 8, marginLeft: -8 },
  
  headerBg: { 
    backgroundColor: "#A93C40", 
    paddingBottom: 40, // Extra padding for overlap
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#A93C40",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10
  },
  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 20, 
    paddingVertical: 12 
  },
  headerName: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", flex: 1, textAlign: "center" },
  closeBtn: { 
    width: 40, height: 40, 
    borderRadius: 20, 
    backgroundColor: "rgba(255,255,255,0.2)", 
    alignItems: "center", justifyContent: "center" 
  },
  
  content: { padding: 20 },
  
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginTop: -40, // Overlaps the header
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 20
  },
  avatarCircle: { 
    width: 90, height: 90, 
    borderRadius: 45, 
    backgroundColor: "#1A2B4A", 
    alignItems: "center", justifyContent: "center", 
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#FFFFFF"
  },
  avatarInitial: { fontSize: 36, fontWeight: "800", color: "#FFFFFF" },
  name: { fontSize: 24, fontWeight: "800", color: "#1A2B4A", marginBottom: 6 },
  majorMeta: { fontSize: 14, color: "#6B7280", fontWeight: "600", marginBottom: 16 },
  
  roleContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 24 },
  roleBadge: { backgroundColor: "#F0F4F8", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleBadgeCoach: { backgroundColor: "rgba(201, 147, 58, 0.15)" },
  roleText: { color: "#1A2B4A", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  roleTextCoach: { color: "#C9933A" },
  
  quickActions: { flexDirection: "row", gap: 16 },
  actionCircle: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  
  statsGrid: { flexDirection: "row", gap: 16, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statNumber: { fontSize: 28, fontWeight: "800", color: "#1A2B4A", marginVertical: 8 },
  statLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  
  overviewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  overviewItem: { flex: 1 },
  overviewLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600", marginBottom: 4 },
  overviewValue: { fontSize: 24, fontWeight: "800", color: "#1A2B4A" },
  
  progressContainer: { marginTop: 8 },
  progressBarBg: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },

  detailsCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 20,
    shadowColor: "#1A2B4A", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 12, 
    elevation: 2 
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#1A2B4A", marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", marginRight: 16 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 13, color: "#6B7280", fontWeight: "500", marginBottom: 4 },
  infoValue: { fontSize: 15, color: "#1A2B4A", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  
  statusBadge: { backgroundColor: "#E5F6FD", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#0369A1", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

  expandedSessionContent: {
    marginTop: 12,
    marginLeft: 56, // aligns with text
    paddingRight: 16,
  },
  sessionDetailText: { fontSize: 13, color: "#4B5563", marginBottom: 6 },
  sessionReportBox: {
    marginTop: 8,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#A93C40"
  },
  sessionReportTitle: { fontSize: 12, fontWeight: "700", color: "#A93C40", marginBottom: 4 },
  sessionReportText: { fontSize: 14, color: "#4B5563", marginTop: 2, lineHeight: 20 },
  submitReportBtn: { backgroundColor: "#1A2B4A", paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 12 },
  submitReportBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

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
    shadowColor: "#A93C40",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabSecondary: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  fabTextPrimary: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
