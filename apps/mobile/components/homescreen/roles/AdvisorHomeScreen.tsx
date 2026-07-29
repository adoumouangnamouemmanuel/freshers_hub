import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassCard } from '../GlassCard';

export function AdvisorHomeScreen({ dashboardData, isCounsellor = false }: { dashboardData: any, isCounsellor?: boolean }) {
  const router = useRouter();
  
  const statsData = isCounsellor ? dashboardData?.counsellingStats : dashboardData?.advisingStats;
  const stats = statsData?.stats || {};
  const upcomingSession = statsData?.upcomingSessions?.[0];

  const primaryColor = isCounsellor ? '#10B981' : '#4F46E5'; // Green vs Indigo
  const primaryBg = isCounsellor ? 'rgba(16, 185, 129, 0.9)' : 'rgba(79, 70, 229, 0.9)';
  const dashboardRoute = isCounsellor ? "/(tabs)/counselling-dashboard" : "/(tabs)/advising-dashboard";

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{isCounsellor ? 'Counselling Overview' : 'Advising Overview'}</Text>
      
      <View style={styles.row}>
        <GlassCard 
          color={primaryBg}
          delay={100}
          onPress={() => router.push(dashboardRoute as any)}
          style={styles.mainStatCard}
        >
          <IconSymbol name="calendar" size={28} color="#FFFFFF" />
          <Text style={styles.mainValue}>{stats.today_sessions ?? 0}</Text>
          <Text style={styles.mainLabel}>Sessions Today</Text>
        </GlassCard>
        
        <View style={styles.col}>
          <GlassCard 
            color="rgba(255,255,255,0.9)"
            delay={150}
            onPress={() => router.push(dashboardRoute as any)}
            style={styles.smallStatCard}
          >
            <Text style={styles.smallValue}>{stats.this_week_sessions ?? 0}</Text>
            <Text style={styles.smallLabel}>This Week</Text>
          </GlassCard>
          
          <GlassCard 
            color={stats.overdue_sessions > 0 ? "rgba(254, 242, 242, 0.9)" : "rgba(255,255,255,0.9)"}
            delay={200}
            onPress={() => router.push(dashboardRoute as any)}
            style={styles.smallStatCard}
          >
            <Text style={[styles.smallValue, stats.overdue_sessions > 0 && { color: '#DC2626' }]}>
              {stats.overdue_sessions ?? 0}
            </Text>
            <Text style={[styles.smallLabel, stats.overdue_sessions > 0 && { color: '#EF4444' }]}>
              Overdue
            </Text>
          </GlassCard>
        </View>
      </View>
      
      {upcomingSession && (
        <GlassCard 
          color="rgba(255,255,255,0.8)"
          delay={300}
          onPress={() => router.push(dashboardRoute as any)}
          style={styles.nextCard}
        >
          <View style={styles.nextLeft}>
            <Text style={[styles.nextLabel, { color: primaryColor }]}>UP NEXT</Text>
            <Text style={styles.nextStudent}>{upcomingSession.student_name}</Text>
            <Text style={styles.nextTime}>
              {new Date(upcomingSession.date || upcomingSession.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[styles.nextIcon, { backgroundColor: isCounsellor ? '#D1FAE5' : '#EEF2FF' }]}>
            <IconSymbol name="arrow.right" size={20} color={primaryColor} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
