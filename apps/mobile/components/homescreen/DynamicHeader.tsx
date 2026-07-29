import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth-context';
import { apiRequest, API_URL } from '@/lib/api';

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

export function NotificationBell() {
  const router = useRouter();
  const { session } = useAuth();
  
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${session?.accessToken}` };
      return apiRequest<{ unreadCount: number }>("/notifications/unread-count", { headers });
    },
    enabled: !!session?.accessToken,
    refetchInterval: 60000,
  });
  
  const unreadCount = unreadData?.unreadCount || 0;

  return (
    <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications")}>
      <IconSymbol name="bell.fill" size={22} color="#1A2B4A" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function DynamicHeader() {
  const { session } = useAuth();
  const router = useRouter();

  const firstName = session?.user.fullName?.split(" ")[0] ?? "there";
  const userInitial = session?.user.fullName?.charAt(0).toUpperCase() ?? "?";

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", color: "#F59E0B" }; // Amber for morning
    if (hour < 18) return { text: "Good afternoon", color: "#3B82F6" }; // Blue for afternoon
    return { text: "Good evening", color: "#4338CA" }; // Indigo for evening
  };

  const { text: greetingText, color: greetingColor } = getGreetingData();

  return (
    <View style={styles.headerContainer}>
      {/* A subtle dynamic background effect based on time of day */}
      <View style={[styles.glowEffect, { backgroundColor: greetingColor }]} />
      
      <View style={styles.greetingRow}>
        <Pressable style={styles.headerAvatarLarge} onPress={() => router.push("/profile")}>
          {resolveImageUrl(session?.user.avatarUrl) ? (
            <Image source={{ uri: resolveImageUrl(session?.user.avatarUrl)! }} style={styles.headerAvatarImage} />
          ) : (
            <Text style={styles.headerAvatarLargeText}>{userInitial}</Text>
          )}
        </Pressable>
        <View>
          <Text style={styles.greetingTime}>{greetingText},</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>
      </View>
      
      <View style={styles.headerActions}>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/search")}>
          <IconSymbol name="magnifyingglass" size={22} color="#1A2B4A" />
        </Pressable>
        <NotificationBell />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.08,
    filter: 'blur(40px)' as any, // React Native Web supports this, native ignores it or we can just rely on low opacity
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    zIndex: 1,
  },
  headerAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#A93C40",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A93C40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerAvatarLargeText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  greetingTime: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "600",
  },
  greetingName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A2B4A",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
    zIndex: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#A93C40",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
