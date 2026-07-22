import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth-context';
import { isClubLead, isCoachAdmin, isCoach, isAdvisor, isCounsellor } from '@/lib/permissions';

const ACTIVE_TINT   = '#A93C40';
const INACTIVE_TINT = '#9CA3AF';
const TAB_BAR_BG    = '#FFFFFF';
const TAB_BASE_H    = 64; // visual height above the inset

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const router = useRouter();
  const [rolesModalVisible, setRolesModalVisible] = useState(false);
  const tabBarHeight = TAB_BASE_H + insets.bottom;
  
  const showClubAdmin = session?.user?.roles ? isClubLead(session.user.roles) : false;
  const showCoachAdmin = session?.user?.roles ? isCoachAdmin(session.user.roles) : false;
  const showPeerCoach = session?.user?.roles ? isCoach(session.user.roles) : false;
  const showAdvisor = session?.user?.roles ? isAdvisor(session.user.roles) : false;
  
  const showCounsellor = session?.user?.roles ? isCounsellor(session.user.roles) : false;
  
  const elevatedRolesCount = [showClubAdmin, showPeerCoach, showAdvisor, showCounsellor].filter(Boolean).length;
  const showMyRoles = elevatedRolesCount > 1;

  return (
    <>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 2,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          href: (showCoachAdmin || showAdvisor || showCounsellor) ? null : '/(tabs)/map',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-coaching"
        options={{
          title: 'Coaching',
          href: showMyRoles ? null : (showPeerCoach ? '/(tabs)/my-coaching' : null),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.text.rectangle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          href: (showCoachAdmin || showAdvisor || showCounsellor) ? null : '/(tabs)/support',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="heart.text.square.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          href: (showCoachAdmin || showAdvisor || showCounsellor) ? null : '/(tabs)/clubs',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="flag.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          href: (showCoachAdmin || showAdvisor || showCounsellor) ? null : '/(tabs)/help',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="questionmark.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="club-admin"
        options={{
          title: 'My Club',
          href: showMyRoles ? null : (showClubAdmin ? '/(tabs)/club-admin' : null),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="star.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-roles"
        options={{
          title: 'My Roles',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="briefcase.fill" color={color} />
          ),
          tabBarButton: showMyRoles 
            ? (props) => (
                <Pressable 
                  {...(props as any)} 
                  onPress={() => setRolesModalVisible(true)} 
                />
              )
            : () => null,
        }}
      />
      <Tabs.Screen
        name="coaching-admin"
        options={{
          title: 'Dashboard',
          href: showCoachAdmin ? '/(tabs)/coaching-admin' : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          href: showCoachAdmin ? '/(tabs)/schedule' : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="calendar" color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="advising-dashboard"
        options={{
          title: 'Advising',
          href: showMyRoles ? null : (showAdvisor ? '/(tabs)/advising-dashboard' : null),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="book.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="counselling-dashboard"
        options={{
          title: 'Counselling',
          href: showMyRoles ? null : (showCounsellor ? '/(tabs)/counselling-dashboard' as any : null),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="heart.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          href: (showCoachAdmin || showAdvisor || showCounsellor) ? '/(tabs)/students' : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.3.fill" color={color} />
          ),
        }}
      />
    </Tabs>

    <Modal
      visible={rolesModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setRolesModalVisible(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setRolesModalVisible(false)}>
        <Pressable style={[styles.modalContent, { marginBottom: tabBarHeight - 5 }]} onPress={e => e.stopPropagation()}>
          <View style={styles.modalBody}>
            {showPeerCoach && (
              <Pressable style={styles.roleCard} onPress={() => { setRolesModalVisible(false); router.push('/(tabs)/my-coaching' as any); }}>
                <View style={[styles.roleIcon, { backgroundColor: '#eef2ff' }]}>
                  <IconSymbol name="person.3.fill" size={24} color="#4f46e5" />
                </View>
                <Text style={styles.roleCardTitle}>Coaching</Text>
              </Pressable>
            )}
            {showClubAdmin && (
              <Pressable style={styles.roleCard} onPress={() => { setRolesModalVisible(false); router.push('/(tabs)/club-admin' as any); }}>
                <View style={[styles.roleIcon, { backgroundColor: '#fef3c7' }]}>
                  <IconSymbol name="star.fill" size={24} color="#d97706" />
                </View>
                <Text style={styles.roleCardTitle}>My Club</Text>
              </Pressable>
            )}
            {showAdvisor && (
              <Pressable style={styles.roleCard} onPress={() => { setRolesModalVisible(false); router.push('/(tabs)/advising-dashboard' as any); }}>
                <View style={[styles.roleIcon, { backgroundColor: '#e0f2fe' }]}>
                  <IconSymbol name="book.fill" size={24} color="#0284c7" />
                </View>
                <Text style={styles.roleCardTitle}>Advising</Text>
              </Pressable>
            )}
            {showCounsellor && (
              <Pressable style={styles.roleCard} onPress={() => { setRolesModalVisible(false); router.push('/(tabs)/counselling-dashboard' as any); }}>
                <View style={[styles.roleIcon, { backgroundColor: '#fce7f3' }]}>
                  <IconSymbol name="heart.fill" size={24} color="#db2777" />
                </View>
                <Text style={styles.roleCardTitle}>Counselling</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 20,
    paddingBottom: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  modalBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  roleCard: {
    alignItems: 'center',
    width: 80,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});