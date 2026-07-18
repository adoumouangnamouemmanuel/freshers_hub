import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Pressable,
  ScrollView,
  RefreshControl
} from "react-native"; 
import globalStyles from '../styles';
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Notification = {
  id: string;
  category: string;
  title: string;
  body: string;
  relatedEntity: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!session?.accessToken) return;
    try {
      const data = await apiRequest<{ notifications: Notification[] }>("/notifications", {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications().finally(() => setIsLoading(false));
  }, [session?.accessToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    if (!session?.accessToken) return;
    try {
      await apiRequest("/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handlePressNotification = async (notification: Notification) => {
    if (!notification.readAt && session?.accessToken) {
      try {
        await apiRequest(`/notifications/${notification.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n
        ));
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    }

    if (notification.relatedEntity) {
      const [type, id] = notification.relatedEntity.split(":");
      if (type === "post") {
        router.push({ pathname: "/post/[id]", params: { id } } as any);
      } else if (type === "event") {
        router.push({ pathname: "/event/[id]", params: { id } } as any);
      }
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case "event": return "calendar";
      case "announcement": return "megaphone.fill";
      default: return "bell.fill";
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <Pressable onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A93C40" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <IconSymbol name="bell.slash.fill" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyDesc}>We&apos;ll notify you when there&apos;s an update for your groups or events.</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A93C40" />}
        >
          {notifications.map(notification => {
            const isUnread = !notification.readAt;
            return (
              <Pressable 
                key={notification.id} 
                style={[styles.notificationCard, isUnread && styles.notificationCardUnread]}
                onPress={() => handlePressNotification(notification)}
              >
                <View style={[styles.iconContainer, isUnread && styles.iconContainerUnread]}>
                  <IconSymbol 
                    name={getIconForCategory(notification.category) as any} 
                    size={20} 
                    color={isUnread ? "#A93C40" : "#6B7280"} 
                  />
                </View>
                <View style={styles.content}>
                  <Text style={[styles.title, isUnread && styles.titleUnread]}>{notification.title}</Text>
                  <Text style={styles.body}>{notification.body}</Text>
                  <Text style={styles.date}>{new Date(notification.createdAt).toLocaleString()}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  markAllText: {
    fontSize: 14,
    color: "#A93C40",
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    gap: 16,
  },
  notificationCardUnread: {
    backgroundColor: "#FEF2F2",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerUnread: {
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
  },
  titleUnread: {
    color: "#1A2B4A",
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: "#9BA3AE",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A93C40",
    marginTop: 6,
  },
});
