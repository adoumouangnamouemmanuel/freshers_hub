import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AdminStats } from '../../hooks/useDashboardData';
import { globalStyles } from '../../styles';

export function AdminDashboard({ adminStats }: { adminStats: AdminStats }) {
  const router = useRouter();

  if (!adminStats || !adminStats.stats) return null;

  const { stats, needsAttention } = adminStats;
  const unassigned = stats.total_freshers - stats.assigned_freshers;
  const sessionProgress = stats.target_mandatory_sessions > 0 
    ? Math.round((stats.completed_mandatory_sessions / stats.target_mandatory_sessions) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Program Health</Text>
        <Pressable style={styles.manageBtn} onPress={() => router.push("/(tabs)/coaching-admin")}>
          <Text style={styles.manageBtnText}>Manage</Text>
          <IconSymbol name="arrow.right" size={14} color="#4338CA" />
        </Pressable>
      </View>

      {/* Main KPI Card */}
      <Pressable style={styles.kpiCard} onPress={() => router.push("/(tabs)/coaching-admin")}>
        <View style={styles.kpiHeader}>
          <View>
            <Text style={styles.kpiLabel}>Unassigned Freshers</Text>
            <Text style={[styles.kpiValue, unassigned > 0 ? { color: '#E11D48' } : { color: '#059669' }]}>
              {unassigned}
            </Text>
          </View>
          <View style={[styles.kpiIconWrap, unassigned > 0 ? { backgroundColor: '#FFE4E6' } : { backgroundColor: '#D1FAE5' }]}>
            <IconSymbol name={unassigned > 0 ? "exclamationmark.triangle.fill" : "checkmark.seal.fill"} size={24} color={unassigned > 0 ? "#E11D48" : "#059669"} />
          </View>
        </View>
        <View style={styles.kpiFooter}>
          <Text style={styles.kpiFooterText}>
            {unassigned > 0 
              ? `${unassigned} students need a coach assigned.` 
              : "All students have been assigned to coaches!"}
          </Text>
        </View>
      </Pressable>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.gridItem}>
          <IconSymbol name="person.3.fill" size={20} color="#4F46E5" />
          <Text style={styles.gridValue}>{stats.total_freshers}</Text>
          <Text style={styles.gridLabel}>Freshers</Text>
        </View>
        <View style={styles.gridItem}>
          <IconSymbol name="graduationcap.fill" size={20} color="#0891B2" />
          <Text style={styles.gridValue}>{stats.active_coaches}</Text>
          <Text style={styles.gridLabel}>Coaches</Text>
        </View>
        <View style={styles.gridItem}>
          <IconSymbol name="calendar.badge.clock" size={20} color="#EA580C" />
          <Text style={styles.gridValue}>{stats.upcoming_sessions_count}</Text>
          <Text style={styles.gridLabel}>Upcoming</Text>
        </View>
        <View style={styles.gridItem}>
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#E11D48" />
          <Text style={styles.gridValue}>{stats.overdue_sessions_count}</Text>
          <Text style={styles.gridLabel}>Overdue</Text>
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressTitle}>Session Compliance</Text>
          <Text style={styles.progressPercent}>{sessionProgress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, sessionProgress)}%` }]} />
        </View>
        <Text style={styles.progressSubtitle}>
          {stats.completed_mandatory_sessions} of {stats.target_mandatory_sessions} mandatory sessions completed
        </Text>
      </View>

      {/* Needs Attention */}
      {needsAttention && needsAttention.length > 0 && (
        <View style={styles.attentionSection}>
          <Text style={styles.attentionTitle}>Needs Attention ({needsAttention.length})</Text>
          <Text style={styles.attentionSubtitle}>Freshers with 0 completed sessions</Text>
          
          <View style={styles.attentionList}>
            {needsAttention.map(fresher => (
              <View key={fresher.id} style={styles.attentionRow}>
                <View style={styles.attentionAvatar}>
                  <Text style={styles.attentionInitial}>{fresher.full_name.charAt(0)}</Text>
                </View>
                <View style={styles.attentionInfo}>
                  <Text style={styles.attentionName}>{fresher.full_name}</Text>
                  <Text style={styles.attentionCoach}>Coach: {fresher.coach_name}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
  container: {
    marginVertical: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  manageBtnText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  kpiLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  kpiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  kpiFooterText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  progressSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  attentionSection: {
    marginTop: 8,
  },
  attentionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  attentionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  attentionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attentionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48',
  },
  attentionInfo: {
    flex: 1,
  },
  attentionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  attentionCoach: {
    fontSize: 13,
    color: '#6B7280',
  },
});
