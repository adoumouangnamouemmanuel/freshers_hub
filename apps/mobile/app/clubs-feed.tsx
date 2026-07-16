import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  eventId: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  groupName?: string;
};

function ClubPostCard({ post, index }: { post: Post; index: number }) {
  const router = useRouter();
  const { session } = useAuth();
  const [expanded, setExpanded] = useState(false);
  
  const isOwner = session?.user?.id === post.authorId;
  const isLong = post.content && post.content.length > 150;
  const displayContent = isLong && !expanded ? `${post.content.substring(0, 150)}...` : post.content;

  return (
    <Animated.View entering={FadeInDown.delay(100 + (index * 50)).duration(500)}>
      <Pressable 
        style={styles.postCard} 
        onPress={() => {
          if (isOwner) {
            router.push(`/post/${post.id}` as any);
          } else if (isLong) {
            setExpanded(!expanded);
          }
        }}
      >
        {post.groupName && (
          <View style={styles.groupBadge}>
            <IconSymbol name="person.2.fill" size={12} color="#1A2B4A" />
            <Text style={styles.groupBadgeText}>{post.groupName}</Text>
          </View>
        )}
        
        <View style={styles.postHeader}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>{post.authorName?.charAt(0) || '?'}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <Text style={styles.postMeta}>
              {new Date(post.createdAt).toLocaleDateString()} • {post.category}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{post.category}</Text>
          </View>
        </View>
        
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postContent}>
          {displayContent}
          {isLong && !expanded && <Text style={styles.viewMoreInline}> View more</Text>}
        </Text>
        
        {post.eventId && (
          <View style={styles.eventCard}>
            <IconSymbol name="calendar" size={16} color="#C9933A" />
            <Text style={styles.eventText}>
              Event on {new Date(post.eventDate!).toLocaleDateString()} at {post.eventLocation}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function ClubsFeedScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchPosts = async () => {
    if (!session?.accessToken) return;
    try {
      const data = await apiRequest<{ posts: Post[] }>(`/groups/my/posts`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Error fetching clubs feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [session?.accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: '#fffaf3' }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <View style={styles.screen}>
        {/* Premium Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.headerBg, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>My Clubs Feed</Text>
            <View style={styles.iconBtn} />
          </View>
        </Animated.View>

        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="newspaper.fill" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
              <Text style={styles.emptySubtitle}>The clubs you belong to haven't posted anything recently.</Text>
            </View>
          ) : (
            posts.map((post, idx) => (
              <ClubPostCard key={post.id} post={post} index={idx} />
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fffaf3",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBg: {
    backgroundColor: '#A93C40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2B4A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A2B4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B4A',
  },
  postMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C9933A',
    textTransform: 'capitalize',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2B4A',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  viewMoreInline: {
    color: "#6B7280",
    fontWeight: "700",
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffaf3',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#C9933A',
    gap: 8,
  },
  eventText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B4A',
    flex: 1,
  },
});
