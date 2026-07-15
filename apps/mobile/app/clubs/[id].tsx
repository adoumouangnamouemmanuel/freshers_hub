import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Image, Share, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

type Member = {
  id: string;
  full_name: string;
  avatar_url?: string;
  is_leader: boolean;
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

export default function ClubDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);

  // Determine if the current user is a member
  const isMember = club?.members.some(m => m.id === session?.user.id) || false;

  const fetchClubDetails = async () => {
    if (!id || !session?.accessToken) return;
    try {
      const data = await apiRequest<{ group: ClubDetails }>(`/groups/${id}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setClub(data.group);
    } catch (err) {
      console.error("Error fetching club details:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClubDetails();
  }, [id, session?.accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubDetails();
  };

  const handleJoin = async () => {
    // Mock join action since POST /groups/:id/join is not implemented yet
    setJoining(true);
    setTimeout(() => {
      setJoining(false);
      if (club && session?.user) {
        setClub({
          ...club,
          memberCount: club.memberCount + 1,
          members: [...club.members, { id: session.user.id, full_name: session.user.fullName || 'You', is_leader: false }]
        });
      }
    }, 800);
  };

  const handleShare = async () => {
    if (!club) return;
    try {
      await Share.share({
        message: `Check out ${club.name} on Freshers Hub!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  if (!club) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
        <Text style={styles.errorText}>Club not found</Text>
        <TouchableOpacity style={styles.backBtnAlt} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.coverWrapper}>
          {club.image_url ? (
            <Image source={{ uri: club.image_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="images-outline" size={48} color="#9CA3AF" />
            </View>
          )}
          
          <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{club.name}</Text>
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{club.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{club.memberCount} Members</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              {club.description || "This club hasn't provided a description yet. Join to find out more!"}
            </Text>
          </View>

          {club.leaders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leaders</Text>
              {club.leaders.map(leader => (
                <View key={leader.id} style={styles.memberCard}>
                  {leader.avatar_url ? (
                    <Image source={{ uri: leader.avatar_url }} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberAvatarText}>{leader.full_name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{leader.full_name}</Text>
                    <Text style={styles.memberRole}>Club Leader</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Members</Text>
            {club.members.filter(m => !m.is_leader).length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersScroll}>
                {club.members.filter(m => !m.is_leader).map(member => (
                  <View key={member.id} style={styles.smallMemberCard}>
                    {member.avatar_url ? (
                      <Image source={{ uri: member.avatar_url }} style={styles.smallAvatar} />
                    ) : (
                      <View style={styles.smallAvatarPlaceholder}>
                        <Text style={styles.smallAvatarText}>{member.full_name.charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={styles.smallMemberName} numberOfLines={1}>{member.full_name.split(' ')[0]}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Be the first to join!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.actionBtn, isMember && styles.actionBtnActive]} 
          onPress={isMember ? undefined : handleJoin}
          disabled={isMember || joining}
        >
          {joining ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.actionBtnText, isMember && styles.actionBtnTextActive]}>
              {isMember ? "Joined" : "Join Club"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  errorText: { fontSize: 18, fontWeight: "700", color: "#4B5563", marginTop: 12, marginBottom: 24 },
  backBtnAlt: { backgroundColor: "#1A2B4A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  
  coverWrapper: { width: "100%", height: 300, position: "relative" },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: { width: "100%", height: "100%", backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  
  headerSafeArea: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12 },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  
  content: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, padding: 24 },
  
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "900", color: "#111827", flex: 1 },
  
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  badge: { backgroundColor: "#F3F4F6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 13, fontWeight: "700", color: "#4B5563", textTransform: "uppercase" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 16 },
  description: { fontSize: 16, color: "#4B5563", lineHeight: 24 },
  
  memberCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#F9FAFB", padding: 16, borderRadius: 20, marginBottom: 12 },
  memberAvatar: { width: 56, height: 56, borderRadius: 28 },
  memberAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 20, fontWeight: "800", color: "#4338CA" },
  memberName: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 4 },
  memberRole: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  
  membersScroll: { gap: 16 },
  smallMemberCard: { alignItems: "center", width: 64, gap: 8 },
  smallAvatar: { width: 64, height: 64, borderRadius: 32 },
  smallAvatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  smallAvatarText: { fontSize: 24, fontWeight: "700", color: "#9CA3AF" },
  smallMemberName: { fontSize: 13, fontWeight: "600", color: "#4B5563", textAlign: "center" },
  
  emptyText: { fontSize: 14, color: "#9CA3AF", fontStyle: "italic" },
  
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  actionBtn: { backgroundColor: "#1A2B4A", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionBtnActive: { backgroundColor: "#F3F4F6" },
  actionBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  actionBtnTextActive: { color: "#9CA3AF" },
});
