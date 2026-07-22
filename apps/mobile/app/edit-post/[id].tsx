import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from "react-native"; 
import globalStyles from '../../styles';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
};

export default function EditPostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Announcement");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["Announcement", "Event", "Alert"];

  const { isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const data = await apiRequest<{ post: Post }>(`/posts/${id}`);
      setTitle(data.post.title);
      setContent(data.post.content);
      const matchedCategory = categories.find(c => c.toLowerCase() === data.post.category.toLowerCase());
      if (matchedCategory) {
        setCategory(matchedCategory);
      }
      return data;
    },
    enabled: !!id,
    staleTime: 0,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/posts/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          title,
          content,
          category,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.replace(`/post/${id}`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update post.");
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ActivityIndicator size="large" color="#A93C40" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Update</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.form}>
          <View style={styles.categoryContainer}>
            {categories.map(c => (
              <Pressable 
                key={c}
                style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#9BA3AE"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.contentInput}
            placeholder="What's happening on campus?"
            placeholderTextColor="#9BA3AE"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
          />
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable 
            style={[styles.submitBtn, (!title.trim() || !content.trim() || isSubmitting) && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4A",
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  form: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#A93C40",
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F2F5",
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
    color: "#4B5563",
    textAlignVertical: "top",
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  submitBtn: {
    backgroundColor: "#A93C40",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#D1D5DB",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
