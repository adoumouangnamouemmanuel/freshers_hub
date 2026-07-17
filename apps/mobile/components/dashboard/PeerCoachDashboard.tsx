import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AssignedFresher, Session } from '../../hooks/useDashboardData';
import { styles } from './DashboardStyles';

export function PeerCoachDashboard({ 
  assignedFreshers, 
  upcomingSessions 
}: { 
  assignedFreshers: AssignedFresher[];
  upcomingSessions: Session[];
}) {
  const router = useRouter();

  return (
    <View style={styles.coachDashboardContainer}>
      <Text style={styles.cardSectionTitle}>Coach Overview</Text>
      
      <View style={styles.coachStatsRow}>
        <Pressable style={styles.coachStatCard} onPress={() => router.push("/(tabs)/my-coaching")}>
          <View style={styles.statIconBg}>
            <IconSymbol name="person.3.fill" size={20} color="#4338CA" />
          </View>
          <Text style={styles.statValue}>{assignedFreshers.length}</Text>
          <Text style={styles.statLabel}>Freshers</Text>
        </Pressable>

        <Pressable style={styles.coachStatCard} onPress={() => router.push("/(tabs)/support")}>
          <View style={[styles.statIconBg, { backgroundColor: '#DEF7EC' }]}>
            <IconSymbol name="calendar" size={20} color="#059669" />
          </View>
          <Text style={styles.statValue}>{upcomingSessions.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </Pressable>
      </View>

      {assignedFreshers.length > 0 && (
        <Pressable style={styles.fresherListPreview} onPress={() => router.push("/(tabs)/my-coaching")}>
          <Text style={styles.previewTitle}>Recent Freshers</Text>
          <View style={styles.fresherAvatarsRow}>
            {assignedFreshers.slice(0, 4).map((fresher, idx) => (
              <View key={fresher.id} style={[styles.fresherAvatarBubble, { zIndex: 10 - idx, marginLeft: idx > 0 ? -12 : 0 }]}>
                {fresher.avatar_url ? (
                  <Image source={{ uri: fresher.avatar_url }} style={styles.fresherAvatarImage} />
                ) : (
                  <Text style={styles.fresherAvatarText}>{fresher.fresher_name.charAt(0)}</Text>
                )}
              </View>
            ))}
            {assignedFreshers.length > 4 && (
              <View style={[styles.fresherAvatarBubble, styles.fresherAvatarMore, { zIndex: 5, marginLeft: -12 }]}>
                <Text style={styles.fresherAvatarMoreText}>+{assignedFreshers.length - 4}</Text>
              </View>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}
