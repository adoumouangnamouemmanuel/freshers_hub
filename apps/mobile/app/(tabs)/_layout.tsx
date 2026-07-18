import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth-context';
import { isClubLead, isCoachAdmin, isCoach } from '@/lib/permissions';

const ACTIVE_TINT   = '#A93C40';
const INACTIVE_TINT = '#9CA3AF';
const TAB_BAR_BG    = '#FFFFFF';
const TAB_BASE_H    = 64; // visual height above the inset

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const tabBarHeight = TAB_BASE_H + insets.bottom;
  
  console.log("Session roles:", session?.user?.roles);
  console.log("Session user:", session?.user);
  const showClubAdmin = session?.user?.roles ? isClubLead(session.user.roles) : false;
  const showCoachAdmin = session?.user?.roles ? isCoachAdmin(session.user.roles) : false;
  const showPeerCoach = session?.user?.roles ? isCoach(session.user.roles) : false;
  
  const elevatedRolesCount = [showClubAdmin, showPeerCoach].filter(Boolean).length;
  const showMyRoles = elevatedRolesCount > 1;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          position: 'absolute',
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 4,
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
          href: showCoachAdmin ? null : '/(tabs)/map',
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
          href: showCoachAdmin ? null : '/(tabs)/support',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="heart.text.square.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          href: showCoachAdmin ? null : '/(tabs)/clubs',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="flag.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          href: showCoachAdmin ? null : '/(tabs)/help',
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
          href: showMyRoles ? '/(tabs)/my-roles' : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="briefcase.fill" color={color} />
          ),
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
        name="students"
        options={{
          title: 'Students',
          href: showCoachAdmin ? '/(tabs)/students' : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.3.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
