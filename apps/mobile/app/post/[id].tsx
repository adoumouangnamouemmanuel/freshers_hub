import { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator,
  ScrollView,
  Alert 
} from "react-native"; 
import globalStyles from '../../styles';
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { hasRole } from "@/lib/permissions";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  authorName: string;
  authorId: string;
};

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const data = await apiRequest<{ post: Post }>(`/posts/${id}`);
        setPost(data.post);
      } catch (err) {
        console.error("Failed to fetch post", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          setIsDeleting(true);
          try {
            await apiRequest(`/posts/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${session?.accessToken}`
              }
            });
            router.replace("/");
          } catch (error) {
            Alert.alert("Error", "Failed to delete post");
            setIsDeleting(false);
          }
        } 
      }
    ]);
  };

  const isAlert = post?.category.toLowerCase() === "alert";
  const canEditOrDelete = session?.user.id === post?.authorId || hasRole(session?.user.roles || [], "admin");

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 40 }} />
      ) : !post ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Post Not Found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 100) }]}>
          <View style={[styles.card, isAlert && styles.alertCard]}>
            <View style={styles.postHeader}>
              <View style={styles.postAuthorAvatar}>
                <Text style={styles.postAuthorInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.postAuthorInfo}>
                <Text style={styles.postAuthorName}>{post.authorName}</Text>
                <Text style={styles.postDate}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.categoryBadge, isAlert && styles.alertBadge]}>
                <Text style={[styles.categoryBadgeText, isAlert && styles.alertBadgeText]}>
                  {post.category}
                </Text>
              </View>
            </View>
            
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>
          </View>

          {canEditOrDelete && (
            <View style={styles.actionsContainer}>
              <Pressable 
                style={styles.editBtn} 
                onPress={() => router.push({ pathname: "/edit-post/[id]", params: { id: post.id } } as any)}
              >
                <Text style={styles.editBtnText}>Edit Post</Text>
              </Pressable>
              <Pressable 
                style={styles.deleteBtn} 
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#DC2626" size="small" />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete Post</Text>
                )}
              </Pressable>
            </View>
          )}
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
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  closeBtn: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  alertCard: {
    backgroundColor: "#FEF2F2",
    shadowColor: "#DC2626",
    shadowOpacity: 0.06,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  postAuthorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  postAuthorInitial: {
    fontSize: 16,
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
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  alertBadge: {
    backgroundColor: "#FEE2E2",
  },
  alertBadgeText: {
    color: "#DC2626",
  },
  postTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4A",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  postContent: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 26,
  },
  actionsContainer: {
    gap: 12,
  },
  editBtn: {
    backgroundColor: "#1A2B4A",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  editBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  deleteBtnText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "700",
  },
});
