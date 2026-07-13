import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth-context';
import { isClubLead } from '@/lib/permissions';

const ACTIVE_TINT   = '#1f1a17';
const INACTIVE_TINT = '#a89b8f';
const TAB_BAR_BG    = '#fffaf3';
const TAB_BASE_H    = 56; // visual height above the inset

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const tabBarHeight = TAB_BASE_H + insets.bottom;
  
  const showClubAdmin = session?.user?.roles ? isClubLead(session.user.roles) : false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: '#dccfbe',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="newspaper.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="heart.text.square.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="questionmark.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="club-admin"
        options={{
          title: 'My Club',
          href: showClubAdmin ? '/(tabs)/club-admin' : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="star.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
