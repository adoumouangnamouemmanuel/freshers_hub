import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
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

export default function ClubFeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    if (!id || !session?.accessToken) return;
    try {
      const data = await apiRequest<{ posts: Post[] }>(`/groups/${id}/posts`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Error fetching club posts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [id, session?.accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };


  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: '#fffaf3' }]}>
        <ActivityIndicator size="large" color="#1A2B4A" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Club Feed</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="newspaper.fill" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share an update with the club.</Text>
            </View>
          ) : (
            posts.map((post, idx) => (
              <ClubPostCard key={post.id} post={post} index={idx} />
            ))
          )}
        </ScrollView>

        {/* FAB for New Post */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={[styles.fabContainer, { bottom: insets.bottom + 84 }]}>
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => router.push(`/new-post?preselectGroup=${id}` as any)}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>New Post</Text>
          </TouchableOpacity>
        </Animated.View>
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
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    paddingBottom: 24,
    backgroundColor: '#A93C40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
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
  fabContainer: {
    position: 'absolute',
    bottom: 120, // using hardcoded 120 because we don't have insets accessible in styles directly
    right: 24,
    zIndex: 999,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A93C40', // Ashesi Maroon
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    shadowColor: '#A93C40',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

});
