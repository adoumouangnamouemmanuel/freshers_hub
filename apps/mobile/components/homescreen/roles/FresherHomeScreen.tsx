import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassCard } from '../GlassCard';
import { apiRequest, API_URL } from '@/lib/api';

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

export function FresherHomeScreen({ dashboardData, myGroups }: { dashboardData: any, myGroups: any[] }) {
  const router = useRouter();
  
  const assignedCoaches = dashboardData?.fresherData?.assignedCoaches || [];
  const assignedBuddy = dashboardData?.fresherData?.assignedBuddy || null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Support Team</Text>
      
      {(assignedCoaches.length > 0 || assignedBuddy) ? (
        <View style={styles.row}>
          {assignedCoaches.length > 0 && (
            <GlassCard 
              color="rgba(79, 70, 229, 0.9)" // Soft Indigo
              delay={100}
              onPress={() => router.push("/(tabs)/support")}
              style={styles.flex1}
            >
              {resolveImageUrl(assignedCoaches[0].avatar_url) ? (
                <Image source={{ uri: resolveImageUrl(assignedCoaches[0].avatar_url)! }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[styles.avatarPlaceholderText, { color: '#FFF' }]}>{assignedCoaches[0].coach_name.charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.nameWhite}>{assignedCoaches[0].coach_name.split(' ')[0]}</Text>
              <Text style={styles.roleWhite}>Peer Coach</Text>
            </GlassCard>
          )}
          
          {assignedBuddy && (
            <GlassCard 
              color="rgba(255, 255, 255, 0.8)" 
              delay={200}
              onPress={() => router.push("/(tabs)/support")}
              style={styles.flex1}
            >
              {resolveImageUrl(assignedBuddy.avatar_url) ? (
                <Image source={{ uri: resolveImageUrl(assignedBuddy.avatar_url)! }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={styles.avatarPlaceholderTextDark}>{assignedBuddy.buddy_name.charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.nameDark}>{assignedBuddy.buddy_name.split(' ')[0]}</Text>
              <Text style={styles.roleDark}>OIPCC Buddy</Text>
            </GlassCard>
          )}
        </View>
      ) : null}

      {myGroups.length === 0 && (
        <GlassCard 
          delay={300} 
          color="rgba(224, 231, 255, 0.7)" // Soft light indigo
          onPress={() => router.push("/(tabs)/clubs")}
        >
          <View style={styles.actionRow}>
            <Text style={styles.actionText}>Find a community to join</Text>
            <IconSymbol name="chevron.right" size={16} color="#4F46E5" />
          </View>
        </GlassCard>
      )}

      {myGroups.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Your Communities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
            {myGroups.map(club => (
              <GlassCard 
                key={club.id} 
                color="rgba(255,255,255,0.8)" 
                style={styles.clubCard}
                onPress={() => router.push("/(tabs)/clubs")}
              >
                <View style={styles.clubRow}>
                  {resolveImageUrl(club.image_url) ? (
                    <Image source={{uri: resolveImageUrl(club.image_url)!}} style={styles.clubAvatar} />
                  ) : (
                    <View style={styles.clubAvatarMock}>
                      <Text style={styles.clubAvatarText}>{club.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                    <Text style={styles.clubCategory} numberOfLines={1}>{club.category}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 20,
    fontWeight: '700',
  },
  avatarPlaceholderTextDark: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4338CA',
  },
  nameWhite: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleWhite: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  nameDark: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  roleDark: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  clubCard: {
    width: 260,
    padding: 16,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  clubAvatarMock: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
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
  clubCategory: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
});
