import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CoachAssignment, BuddyPairing, Session, Group } from '../../hooks/useDashboardData';
import { styles } from './DashboardStyles';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
};

export function FresherDashboard({
  assignedCoaches,
  assignedBuddy,
  nextSession,
  myGroups
}: {
  assignedCoaches: CoachAssignment[];
  assignedBuddy: BuddyPairing | null;
  nextSession: Session | null;
  myGroups: Group[];
}) {
  const router = useRouter();

  return (
    <View style={styles.cardsStack}>
      
      {(assignedCoaches.length > 0 || assignedBuddy) && (
        <View style={styles.fresherPeopleCard}>
          <Text style={styles.cardSectionTitle}>Your Support Team</Text>
          <View style={styles.peopleRow}>
            {assignedCoaches.length > 0 && (
              <Pressable style={styles.personItem} onPress={() => router.push("/(tabs)/support")}>
                {resolveImageUrl(assignedCoaches[0].avatar_url) ? (
                  <Image source={{ uri: resolveImageUrl(assignedCoaches[0].avatar_url)! }} style={styles.personImage} />
                ) : (
                  <View style={[styles.personImage, styles.personImagePlaceholder]}>
                    <Text style={styles.personImagePlaceholderText}>{assignedCoaches[0].coach_name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.personName}>{assignedCoaches[0].coach_name.split(' ')[0]}</Text>
                <Text style={styles.personRole}>Peer Coach</Text>
              </Pressable>
            )}
            
            {assignedBuddy && (
              <Pressable style={styles.personItem} onPress={() => router.push("/(tabs)/support")}>
                {resolveImageUrl(assignedBuddy.avatar_url) ? (
                  <Image source={{ uri: resolveImageUrl(assignedBuddy.avatar_url)! }} style={styles.personImage} />
                ) : (
                  <View style={[styles.personImage, styles.personImagePlaceholder]}>
                    <Text style={styles.personImagePlaceholderText}>{assignedBuddy.buddy_name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.personName}>{assignedBuddy.buddy_name.split(' ')[0]}</Text>
                <Text style={styles.personRole}>Buddy</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {nextSession && (
        <Pressable style={styles.upNextCard} onPress={() => router.push("/(tabs)/support")}>
          <View style={styles.upNextLeft}>
            <Text style={styles.upNextLabel}>Up next</Text>
            <Text style={styles.upNextTitle}>Session</Text>
            <Text style={styles.upNextTime}>
              {new Date(nextSession.session_date).toLocaleDateString()} at {nextSession.start_time.substring(0, 5)}
            </Text>
          </View>
          <View style={styles.progressRing}>
            <IconSymbol name="calendar" size={20} color="#FFFFFF" />
          </View>
        </Pressable>
      )}

      {myGroups.length === 0 && (
        <Pressable style={styles.clubNudgeCard} onPress={() => router.push("/(tabs)/clubs")}>
          <View style={styles.clubNudgeInfo}>
            <Text style={styles.clubNudgeTitle}>Looking for a community?</Text>
            <Text style={styles.clubNudgeDesc}>Explore 40+ clubs on campus.</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#9BA3AE" />
        </Pressable>
      )}
    </View>
  );
}
