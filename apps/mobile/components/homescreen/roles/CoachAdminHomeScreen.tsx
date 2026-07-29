import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassCard } from '../GlassCard';

export function CoachAdminHomeScreen({ dashboardData, upcomingSessions }: { dashboardData: any, upcomingSessions: any[] }) {
  const router = useRouter();
  
  const adminStats = dashboardData?.adminStats;
  const needsAttentionCount = adminStats?.needsAttention?.length ?? 0;
  const upcomingSession = upcomingSessions?.[0];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Coach Admin Overview</Text>
      
      <View style={styles.row}>
        <GlassCard 
          color={needsAttentionCount > 0 ? "rgba(239, 68, 68, 0.9)" : "rgba(16, 185, 129, 0.9)"} // Red if issues, Green if all good
          delay={100}
          onPress={() => router.push("/(tabs)/coaching-admin/compliance")}
          style={styles.mainStatCard}
        >
          <IconSymbol 
            name={needsAttentionCount > 0 ? "exclamationmark.triangle.fill" : "checkmark.seal.fill"} 
            size={28} 
            color="#FFFFFF" 
          />
          <Text style={styles.mainValue}>{needsAttentionCount}</Text>
          <Text style={styles.mainLabel}>Needs Attention</Text>
        </GlassCard>
        
        <View style={styles.col}>
          <GlassCard 
            color="rgba(255,255,255,0.9)"
            delay={150}
            onPress={() => router.push("/(tabs)/schedule")}
            style={styles.smallStatCard}
          >
            <Text style={styles.smallValue}>{adminStats?.stats?.upcoming_sessions_count ?? 0}</Text>
            <Text style={styles.smallLabel}>Upcoming</Text>
          </GlassCard>
          
          <GlassCard 
            color={adminStats?.stats?.overdue_sessions_count > 0 ? "rgba(254, 242, 242, 0.9)" : "rgba(255,255,255,0.9)"}
            delay={200}
            onPress={() => router.push("/(tabs)/schedule")}
            style={styles.smallStatCard}
          >
            <Text style={[styles.smallValue, adminStats?.stats?.overdue_sessions_count > 0 && { color: '#DC2626' }]}>
              {adminStats?.stats?.overdue_sessions_count ?? 0}
            </Text>
            <Text style={[styles.smallLabel, adminStats?.stats?.overdue_sessions_count > 0 && { color: '#EF4444' }]}>
              Overdue
            </Text>
          </GlassCard>
        </View>
      </View>

      {upcomingSession && (
        <GlassCard 
          color="rgba(255,255,255,0.8)"
          delay={300}
          onPress={() => router.push("/(tabs)/schedule")}
          style={styles.nextCard}
        >
          <View style={styles.nextLeft}>
            <Text style={styles.nextLabel}>UP NEXT</Text>
            <Text style={styles.nextStudent}>{upcomingSession.student_name}</Text>
            <Text style={styles.nextTime}>
              {new Date(upcomingSession.date || upcomingSession.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.nextIcon}>
            <IconSymbol name="arrow.right" size={20} color="#4F46E5" />
          </View>
        </GlassCard>
      )}

      <GlassCard 
        color="rgba(224, 231, 255, 0.7)" 
        delay={400}
        onPress={() => router.push("/(tabs)/coaching-admin")}
        style={styles.actionCard}
      >
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>Open Full Dashboard</Text>
          <IconSymbol name="chevron.right" size={16} color="#4F46E5" />
        </View>
      </GlassCard>
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
  col: {
    flex: 1,
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mainValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 16,
    marginBottom: 4,
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  smallStatCard: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  smallValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 12,
  },
  nextLeft: {
    flex: 1,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 1,
    marginBottom: 6,
  },
  nextStudent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  nextTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCard: {
    marginTop: 12,
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
});
