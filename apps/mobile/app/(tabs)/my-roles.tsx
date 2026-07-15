import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth-context';
import { isClubLead, isCoach } from '@/lib/permissions';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function MyRolesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const showClubAdmin = session?.user?.roles ? isClubLead(session.user.roles) : false;
  const showPeerCoach = session?.user?.roles ? isCoach(session.user.roles) : false;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Roles</Text>
        <Text style={styles.subtitle}>Select a role to manage your responsibilities</Text>
      </View>

      <View style={styles.content}>
        {showPeerCoach && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Pressable 
              style={styles.card}
              onPress={() => router.push('/(tabs)/my-coaching')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#eef2ff' }]}>
                <IconSymbol name="person.3.fill" size={24} color="#4f46e5" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>My Coaching</Text>
                <Text style={styles.cardDescription}>Manage your assigned freshers and sessions</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#9ca3af" />
            </Pressable>
          </Animated.View>
        )}

        {showClubAdmin && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Pressable 
              style={styles.card}
              onPress={() => router.push('/(tabs)/club-admin')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                <IconSymbol name="star.fill" size={24} color="#d97706" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>My Club</Text>
                <Text style={styles.cardDescription}>Manage your club members and feed</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#9ca3af" />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf3',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f1a17',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f1a17',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
