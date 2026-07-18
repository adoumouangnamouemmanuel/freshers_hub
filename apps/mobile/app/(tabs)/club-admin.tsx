/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBar } from "expo-status-bar";

type Member = {
  id: string;
  full_name: string;
  avatar_url?: string;
  isLeader: boolean;
};

type ClubDetails = {
  id: string;
  name: string;
  type: string;
  description: string;
  category: string;
  image_url: string;
  memberCount: number;
  members: Member[];
  leaders: Member[];
};

export default function ClubAdminScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const fetchMyLedClubs = async () => {
    if (!session?.accessToken) return;
    try {
      const data = await apiRequest<{ data: any[] }>('/groups/my', {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const ledClubs = data.data.filter(g => g.isLeader);
      setClubs(ledClubs);
      
      if (ledClubs.length === 1 && !selectedClubId) {
        setSelectedClubId(ledClubs[0].id);
      } else if (ledClubs.length === 0) {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching led clubs:", err);
    }
  };

  const fetchClubDetails = async (id: string) => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session?.accessToken}` };
      const [data, postsData] = await Promise.all([
        apiRequest<{ data: ClubDetails }>(`/groups/${id}`, { headers }),
        apiRequest<{ data: any[] }>(`/groups/${id}/posts`, { headers })
      ]);
      setClub(data.data);
      setRecentPosts(postsData.data?.slice(0, 3) || []); // Get top 3 recent posts
      setEditName(data.data.name);
      setEditDesc(data.data.description || "");
      setEditCategory(data.data.category || "");
    } catch (err) {
      console.error("Error fetching club details:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyLedClubs();
  }, [session?.accessToken]);

  useEffect(() => {
    if (selectedClubId) {
      fetchClubDetails(selectedClubId);
    }
  }, [selectedClubId]);

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedClubId) {
      fetchClubDetails(selectedClubId);
    } else {
      fetchMyLedClubs().then(() => setRefreshing(false));
    }
  };

  const handleSaveInfo = async () => {
    if (!selectedClubId || !session?.accessToken) return;
    try {
      const data = await apiRequest<{ data: ClubDetails }>(`/groups/${selectedClubId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({
          name: editName,
          description: editDesc,
          category: editCategory
        })
      });
      setClub(prev => prev ? { ...prev, ...data.data } : null);
      setIsEditing(false);
      Alert.alert("Success", "Club information updated.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not update club info.");
    }
  };

  if (loading && !club && clubs.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: '#A93C40', flex: 1 }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Selector Screen
  if (clubs.length > 1 && !selectedClubId) {
    return (
      <View style={[styles.screen, { backgroundColor: '#A93C40', paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>Select a Club</Text>
          <Text style={styles.selectorSubtitle}>You lead multiple clubs. Which one would you like to manage?</Text>
        </View>
        <ScrollView contentContainerStyle={styles.selectorContent}>
          {clubs.map((c, idx) => (
            <Animated.View key={c.id} entering={FadeInDown.delay(100 * idx).duration(500)}>
              <TouchableOpacity style={styles.selectorCard} onPress={() => setSelectedClubId(c.id)}>
                <View style={styles.selectorIconCircle}>
                  <IconSymbol name="star.fill" size={24} color="#C9933A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectorClubName}>{c.name}</Text>
                  <Text style={styles.selectorClubMeta}>{c.memberCount} members</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (clubs.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: '#A93C40' }]}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <IconSymbol name="star.fill" size={64} color="#FFFFFF" />
          <Text style={[styles.selectorTitle, { marginTop: 24, textAlign: 'center' }]}>No Clubs Found</Text>
          <Text style={[styles.selectorSubtitle, { textAlign: 'center' }]}>You are not leading any clubs currently.</Text>
        </View>
      </View>
    );
  }

  if (!club) return null;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {/* Deep Navy Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.headerBg, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          {clubs.length > 1 ? (
            <Pressable onPress={() => setSelectedClubId(null)} style={styles.iconBtn}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </Pressable>
          ) : <View style={{ width: 40 }} />}
          <Text style={styles.headerTitle} numberOfLines={1}>Manage Club</Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={[styles.dashboardContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Main Identity Overlay Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.identityCard}>
          <View style={styles.identityHeader}>
            <View style={styles.identityIcon}>
               <IconSymbol name="person.2.fill" size={32} color="#1A2B4A" />
            </View>
            <TouchableOpacity 
              style={[styles.editBtn, isEditing && styles.saveBtn]} 
              onPress={() => isEditing ? handleSaveInfo() : setIsEditing(true)}
            >
              <Text style={[styles.editBtnText, isEditing && styles.saveBtnText]}>
                {isEditing ? "Save" : "Edit Info"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.label}>Club Name</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor="#9CA3AF" />
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={editCategory} onChangeText={setEditCategory} placeholderTextColor="#9CA3AF" />
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={editDesc} onChangeText={setEditDesc} multiline placeholderTextColor="#9CA3AF" />
            </View>
          ) : (
            <>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubCategory}>{club.category || "Uncategorized"}</Text>
              <Text style={styles.clubDesc}>{club.description || "No description provided."}</Text>
            </>
          )}
        </Animated.View>

        {/* Insights Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
          <Text style={styles.cardTitle}>Insights Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <IconSymbol name="person.3.fill" size={24} color="#C9933A" />
              <Text style={styles.statValue}>{club.memberCount}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>
            <View style={styles.statBox}>
              <IconSymbol name="star.fill" size={24} color="#C9933A" />
              <Text style={styles.statValue}>{club.leaders.length}</Text>
              <Text style={styles.statLabel}>Leaders</Text>
            </View>
          </View>
        </Animated.View>

        {/* Members Roster Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Members Roster</Text>
            <Text style={styles.rosterCount}>{club.memberCount}</Text>
          </View>
          
          <View style={styles.membersList}>
            {club.members.slice(0, 5).map(m => {
              const initial = m.full_name?.charAt(0) || '?';
              return (
                <View key={m.id} style={styles.memberRow}>
                  <View style={[styles.memberAvatar, m.isLeader && styles.leaderAvatar]}>
                    <Text style={[styles.memberInitial, m.isLeader && styles.leaderInitial]}>{initial}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.full_name}</Text>
                    {m.isLeader && (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>Leader</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {club.members.length > 5 && (
              <View style={styles.moreMembersContainer}>
                <Text style={styles.moreMembersText}>+ {club.members.length - 5} more members</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Recent Posts Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent Posts</Text>
            <TouchableOpacity onPress={() => router.push(`/club-feed/${club.id}` as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentPosts.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No posts yet. Tap &quot;Manage Feed&quot; to create one.</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {recentPosts.map(post => (
                <View key={post.id} style={styles.recentPostCard}>
                  <View style={styles.recentPostHeader}>
                    <Text style={styles.recentPostCategory}>{post.category}</Text>
                    <Text style={styles.recentPostDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.recentPostTitle}>{post.title}</Text>
                  <Text style={styles.recentPostContent} numberOfLines={2}>{post.content}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={[styles.fabContainer, { bottom: insets.bottom + 84 }]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push(`/club-feed/${club.id}` as any)}
          activeOpacity={0.8}
        >
          <IconSymbol name="newspaper.fill" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Manage Feed</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fffaf3",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBg: {
    backgroundColor: '#A93C40',
    paddingBottom: 60, // gives space for the overlay card
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  dashboardContent: {
    paddingHorizontal: 20,
    marginTop: -20, // Less overlap to avoid covering content
    gap: 20,
  },
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  identityIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fffaf3',
    borderWidth: 2,
    borderColor: '#C9933A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  saveBtn: {
    backgroundColor: '#C9933A',
  },
  saveBtnText: {
    color: '#FFFFFF',
  },
  clubName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A2B4A',
    marginBottom: 4,
  },
  clubCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9933A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  clubDesc: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  editForm: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A2B4A',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2B4A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fffaf3',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A2B4A',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rosterCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C9933A',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membersList: {
    gap: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderAvatar: {
    backgroundColor: '#1A2B4A',
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
  },
  leaderInitial: {
    color: '#C9933A',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  leaderBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leaderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C9933A',
  },
  moreMembersContainer: {
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
  },
  moreMembersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  
  // Recent Posts
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9933A',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  recentPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentPostCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C9933A',
    textTransform: 'uppercase',
  },
  recentPostDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  recentPostTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B4A',
    marginBottom: 4,
  },
  recentPostContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  
  // Selector Styles
  selectorHeader: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  selectorTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  selectorSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  selectorContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3C5A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A4C6A',
  },
  selectorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A2B4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#C9933A',
  },
  selectorClubName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectorClubMeta: {
    fontSize: 14,
    color: '#C9933A',
    fontWeight: '500',
  },

  // FAB Styles
  fabContainer: {
    position: 'absolute',
    right: 24,
    zIndex: 999,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A93C40',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    shadowColor: '#A93C40',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
