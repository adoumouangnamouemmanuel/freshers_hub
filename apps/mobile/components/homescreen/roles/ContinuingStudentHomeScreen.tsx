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

export function ContinuingStudentHomeScreen({ myGroups }: { myGroups: any[] }) {
  const router = useRouter();
  
  const ledClubs = myGroups.filter(g => g.isLeader);
  const memberClubs = myGroups.filter(g => !g.isLeader);

  return (
    <View style={styles.container}>
      {ledClubs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Clubs You Lead</Text>
          <View style={styles.stack}>
            {ledClubs.map((club, idx) => (
              <GlassCard 
                key={club.id}
                color="rgba(255,255,255,0.9)"
                delay={idx * 100}
                onPress={() => router.push("/(tabs)/club-admin")}
                style={styles.ledCard}
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
                    <Text style={styles.clubCategory}>Tap to manage</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="#D1D5DB" />
                </View>
              </GlassCard>
            ))}
          </View>
        </>
      )}

      {(memberClubs.length > 0 || ledClubs.length > 0) ? (
        <Text style={[styles.sectionTitle, { marginTop: ledClubs.length > 0 ? 24 : 0 }]}>
          Your Communities
        </Text>
      ) : null}

      {memberClubs.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {memberClubs.map(club => (
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
      )}

      {myGroups.length === 0 && (
        <GlassCard 
          color="rgba(224, 231, 255, 0.7)" // Soft light indigo
          onPress={() => router.push("/(tabs)/clubs")}
        >
          <View style={styles.actionRow}>
            <Text style={styles.actionText}>Find a community to join</Text>
            <IconSymbol name="chevron.right" size={16} color="#4F46E5" />
          </View>
        </GlassCard>
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
  stack: {
    gap: 12,
  },
  ledCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    padding: 16,
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
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  clubAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4F46E5",
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
