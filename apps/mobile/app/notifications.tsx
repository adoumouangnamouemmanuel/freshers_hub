import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
  RefreshControl,
  Animated,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Animated2, { FadeInDown, SlideInRight } from "react-native-reanimated";
import SessionDetailModal from "@/components/features/sessions/SessionDetailModal";

type AppNotification = {
  id: string;
  category: string;
  title: string;
  body: string;
  relatedEntity: string | null;
  readAt: string | null;
  createdAt: string;
};

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  event:        { icon: "calendar",         color: "#6366F1", bg: "#EEF2FF" },
  announcement: { icon: "megaphone.fill",   color: "#F59E0B", bg: "#FFFBEB" },
  nudge:        { icon: "bell.badge.fill",  color: "#A93C40", bg: "#FEF2F2" },
  session:      { icon: "clock.fill",       color: "#10B981", bg: "#ECFDF5" },
  report:       { icon: "doc.text.fill",    color: "#3B82F6", bg: "#EFF6FF" },
  reminder:     { icon: "alarm.fill",       color: "#EC4899", bg: "#FDF2F8" },
};

const getConfig = (category: string) =>
  CATEGORY_CONFIG[category] ?? { icon: "bell.fill", color: "#6B7280", bg: "#F3F4F6" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Notification card ──────────────────────────────────────────────────────────
function NotificationCard({
  item,
  index,
  onPress,
}: {
  item: AppNotification;
  index: number;
  onPress: (item: AppNotification) => void;
}) {
  const { icon, color, bg } = getConfig(item.category);
  const isUnread = !item.readAt;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated2.View entering={FadeInDown.delay(index * 40).duration(350)}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => onPress(item)}
          style={[styles.card, isUnread && styles.cardUnread]}
        >
          {/* Unread accent bar */}
          {isUnread && <View style={[styles.accentBar, { backgroundColor: color }]} />}

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <IconSymbol name={icon as any} size={22} color={color} />
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
            <View style={styles.cardBadgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: bg }]}>
                <Text style={[styles.categoryBadgeText, { color }]}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
              </View>
              {isUnread && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated2.View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router  = useRouter();
  const { session } = useAuth();
  const insets  = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);

  const headers = { Authorization: `Bearer ${session?.accessToken}` };

  const fetchNotifications = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const data = await apiRequest<{ notifications: AppNotification[] }>(
        "/notifications?page=1&limit=50",
        { headers }
      );
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchNotifications().finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    if (!session?.accessToken) return;
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH", headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {}
  };

  const handlePressNotification = async (notification: AppNotification) => {
    if (!notification.readAt) {
      try {
        await apiRequest(`/notifications/${notification.id}/read`, { method: "PATCH", headers });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      } catch {}
    }
    if (notification.relatedEntity) {
      const [type, id] = notification.relatedEntity.split(":");
      if (type === "post")  router.push({ pathname: "/post/[id]",  params: { id } } as any);
      if (type === "event") router.push({ pathname: "/event/[id]", params: { id } } as any);
      if (type === "session") {
        try {
          const sessionData = await apiRequest(`/support/sessions/${id}`, { headers });
          setSelectedSession(sessionData);
          setSessionModalVisible(true);
        } catch (err) {
          Alert.alert("Error", "Could not fetch session details. It may have been deleted.");
        }
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const categories  = ["all", ...Array.from(new Set(notifications.map((n) => n.category)))];
  
  const filtered = (filter === "all" ? notifications : notifications.filter((n) => n.category === filter))
    .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.body.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color="#1A2B4A" />
        </Pressable>
        
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {/* ── Filter pills ──────────────────────────────────────────────────── */}
      {!isLoading && notifications.length > 0 && (
        <View style={styles.filterRow}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => c}
            contentContainerStyle={styles.filterContent}
            renderItem={({ item: cat }) => (
              <Pressable
                style={[styles.filterPill, filter === cat && styles.filterPillActive]}
                onPress={() => setFilter(cat)}
              >
                <Text style={[styles.filterPillText, filter === cat && styles.filterPillTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A93C40" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIllustration}>
            <IconSymbol name="bell.slash.fill" size={44} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyBody}>
            {filter === "all"
              ? "You have no notifications yet. We'll let you know when something happens."
              : `No "${filter}" notifications found.`}
          </Text>
          {filter !== "all" && (
            <Pressable onPress={() => setFilter("all")} style={styles.clearFilterBtn}>
              <Text style={styles.clearFilterText}>Show all</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A93C40" />
          }
          renderItem={({ item, index }) => (
            <NotificationCard item={item} index={index} onPress={handlePressNotification} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          visible={sessionModalVisible}
          onClose={() => setSessionModalVisible(false)}
          onRefresh={fetchNotifications}
          currentUserId={session?.user?.id}
          accessToken={session?.accessToken}
          isCounsellorView={session?.user?.roles?.some(r => r.name === "peer_counsellor" || r.name === "peer_coach")}
          currentUserRoles={session?.user?.roles}
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F0F4F8" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#F0F4F8",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4A" },
  headerSub:   { fontSize: 12, color: "#A93C40", fontWeight: "600", marginTop: 2 },
  markAllBtn:  { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#FEF2F2", borderRadius: 20 },
  markAllText: { fontSize: 13, color: "#A93C40", fontWeight: "700" },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    padding: 0,
  },

  /* Filters */
  filterRow:     { backgroundColor: "#FFFFFF", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E8ECF0" },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterPill:    {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#F0F4F8", borderWidth: 1, borderColor: "transparent",
  },
  filterPillActive: { backgroundColor: "#1A2B4A", borderColor: "#1A2B4A" },
  filterPillText:   { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  filterPillTextActive: { color: "#FFFFFF" },

  /* List */
  list:      { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  separator: { height: 8 },

  /* Card */
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    gap: 12,
  },
  cardUnread: { backgroundColor: "#FAFAFA", shadowOpacity: 0.10 },
  accentBar:  { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  iconWrap:   { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardContent: { flex: 1, gap: 4 },
  cardTopRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle:   { flex: 1, fontSize: 15, fontWeight: "600", color: "#374151", marginRight: 8 },
  cardTitleUnread: { color: "#111827", fontWeight: "800" },
  cardTime:    { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  cardBody:    { fontSize: 13, color: "#6B7280", lineHeight: 19 },
  cardBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  unreadDot:   { width: 7, height: 7, borderRadius: 4 },

  /* Empty state */
  center:              { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIllustration:   {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle:      { fontSize: 20, fontWeight: "800", color: "#1A2B4A", marginBottom: 8 },
  emptyBody:       { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  clearFilterBtn:  { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#1A2B4A", borderRadius: 20 },
  clearFilterText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
