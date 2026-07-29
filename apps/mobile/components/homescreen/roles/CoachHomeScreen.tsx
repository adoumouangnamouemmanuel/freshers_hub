import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassCard } from '../GlassCard';
import { apiRequest, API_URL } from '@/lib/api';

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

export function CoachHomeScreen({ dashboardData }: { dashboardData: any }) {
  const router = useRouter();
  
  const assignedFreshers = dashboardData?.coachData?.assignedFreshers || [];
  const upcomingSessions = dashboardData?.sessions?.upcoming || [];
  const overdueSessions = dashboardData?.sessions?.overdue || [];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Coach Overview</Text>
      
      <View style={styles.statsRow}>
        <GlassCard 
          color="rgba(255,255,255,0.9)" 
          delay={100}
          onPress={() => router.push("/(tabs)/my-coaching")}
          style={styles.statCard}
        >
          <View style={styles.iconBgBlue}>
            <IconSymbol name="person.3.fill" size={20} color="#4338CA" />
          </View>
          <Text style={styles.statValueDark}>{assignedFreshers.length}</Text>
          <Text style={styles.statLabel}>Freshers</Text>
        </GlassCard>

        <GlassCard 
          color="rgba(255,255,255,0.9)" 
          delay={200}
          onPress={() => router.push("/(tabs)/support")}
          style={styles.statCard}
        >
          <View style={styles.iconBgGreen}>
            <IconSymbol name="calendar" size={20} color="#059669" />
          </View>
          <Text style={styles.statValueDark}>{upcomingSessions.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </GlassCard>
        
        <GlassCard 
          color={overdueSessions.length > 0 ? "rgba(254, 242, 242, 0.9)" : "rgba(255,255,255,0.9)"} 
          delay={300}
          onPress={() => router.push("/(tabs)/support")}
          style={styles.statCard}
        >
          <View style={styles.iconBgRed}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#DC2626" />
          </View>
          <Text style={[styles.statValueDark, overdueSessions.length > 0 && { color: '#DC2626' }]}>
            {overdueSessions.length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </GlassCard>
      </View>

      {assignedFreshers.length > 0 && (
        <GlassCard 
          color="rgba(255,255,255,0.8)" 
          delay={400}
          onPress={() => router.push("/(tabs)/my-coaching")}
          style={styles.previewCard}
        >
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Your Freshers</Text>
            <IconSymbol name="chevron.right" size={20} color="#D1D5DB" />
          </View>
          <View style={styles.avatarsRow}>
            {assignedFreshers.slice(0, 5).map((fresher: any, idx: number) => (
              <View key={fresher.id} style={[styles.avatarBubble, { zIndex: 10 - idx, marginLeft: idx > 0 ? -12 : 0 }]}>
                {resolveImageUrl(fresher.avatar_url) ? (
                  <Image source={{ uri: resolveImageUrl(fresher.avatar_url)! }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{fresher.fresher_name.charAt(0)}</Text>
                )}
              </View>
            ))}
            {assignedFreshers.length > 5 && (
              <View style={[styles.avatarBubble, styles.avatarMore, { zIndex: 5, marginLeft: -12 }]}>
                <Text style={styles.avatarMoreText}>+{assignedFreshers.length - 5}</Text>
              </View>
            )}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  iconBgBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconBgGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DEF7EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconBgRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValueDark: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  previewCard: {
    marginTop: 12,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F2F5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  avatarMore: {
    backgroundColor: '#EEF2FF',
  },
  avatarMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
});
