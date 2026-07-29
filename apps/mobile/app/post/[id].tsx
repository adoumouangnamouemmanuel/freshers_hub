/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator,
  ScrollView,
  Alert,
  Image
} from "react-native"; 
import globalStyles from '../../styles';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { apiRequest, API_URL } from "@/lib/api";
import { hasRole } from "@/lib/permissions";

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
};

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  authorName: string;
  authorId: string;
  authorAvatar?: string;
  eventId?: string;
};

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const data = await apiRequest<{ post: Post }>(`/posts/${id}`);
      return data.post;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (post?.category === 'event' && post.eventId) {
      router.replace({ pathname: "/event/[id]", params: { id: post.eventId } } as any);
    }
  }, [post]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/posts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.replace("/");
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete post");
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          setIsDeleting(true);
          deleteMutation.mutate();
        } 
      }
    ]);
  };

  const isAlert = post?.category.toLowerCase() === "alert";
  const canEditOrDelete = session?.user.id === post?.authorId || hasRole(session?.user.roles || [], "admin");

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        {canEditOrDelete && post && (
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push({ pathname: "/edit-post/[id]", params: { id: post?.id } } as any)} style={styles.iconBtn}>
              <IconSymbol name="pencil" size={22} color="#1A2B4A" />
            </Pressable>
            <Pressable onPress={handleDelete} disabled={isDeleting} style={styles.iconBtn}>
              {isDeleting ? (
                <ActivityIndicator color="#DC2626" size="small" />
              ) : (
                <IconSymbol name="trash.fill" size={22} color="#DC2626" />
              )}
            </Pressable>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A93C40" />
        </View>
      ) : !post ? (
        <View style={styles.loadingContainer}>
          <IconSymbol name="megaphone.fill" size={48} color="#D1D5DB" />
          <Text style={styles.errorText}>Post not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtnFallback}>
            <Text style={styles.backBtnFallbackText}>Go Back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 100) }}>
          
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, isAlert ? styles.alertBadge : (post.category.toLowerCase() === 'announcement' ? styles.announcementBadge : undefined)]}>
              <Text style={[styles.categoryBadgeText, isAlert ? styles.alertBadgeText : (post.category.toLowerCase() === 'announcement' ? styles.announcementBadgeText : undefined)]}>
                {post.category}
              </Text>
            </View>
            <Text style={styles.title}>{post.title}</Text>
          </View>

          <View style={styles.authorBox}>
            {resolveImageUrl(post.authorAvatar) ? (
              <Image source={{ uri: resolveImageUrl(post.authorAvatar)! }} style={styles.postAuthorAvatarImage} />
            ) : (
              <View style={styles.postAuthorAvatar}>
                <Text style={styles.postAuthorInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.postAuthorInfo}>
              <Text style={styles.postAuthorName}>{post.authorName}</Text>
              <Text style={styles.postDate}>
                {new Date(post.createdAt).toLocaleDateString(undefined, { 
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                })}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.description}>{post.content}</Text>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ...globalStyles.layout,
  ...globalStyles.typography,
  ...globalStyles.components,
  screen: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FAFAFA",
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F9FA", gap: 16 },
  errorText: { fontSize: 18, color: "#1A2B4A", fontWeight: "700" },
  backBtnFallback: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#A93C40", borderRadius: 12 },
  backBtnFallbackText: { color: "#FFFFFF", fontWeight: "700" },
  
  content: { 
    flex: 1,
  },
  
  cardHeader: {
    paddingHorizontal: 24,
    marginBottom: 24,
    marginTop: 16,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A2B4A",
    lineHeight: 32,
    letterSpacing: -0.5,
  },

  authorBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  
  postAuthorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  postAuthorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  postAuthorInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  postDate: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  categoryBadge: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  alertBadge: {
    backgroundColor: "#FEF2F2",
  },
  alertBadgeText: {
    color: "#DC2626",
  },
  announcementBadge: {
    backgroundColor: "#FFFBEB",
  },
  announcementBadgeText: {
    color: "#F59E0B",
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 26,
  },
});
