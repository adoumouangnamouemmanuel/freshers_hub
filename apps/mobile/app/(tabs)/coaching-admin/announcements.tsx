import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/auth-context";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function AnnouncementsScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const router = useRouter();
  
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("coaching_unit");

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-announcements'],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`${API_URL}/support/admin/announcements?page=${pageParam}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta) return undefined;
      return allPages.length < lastPage.meta.totalPages ? allPages.length + 1 : undefined;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const announcements = data?.pages.flatMap(page => page.data || []) || [];

  const loadMore = () => {
    if (!loadingMore && hasMore && !isCreating) {
      fetchNextPage();
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/support/admin/announcements`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetAudience: audience, title, content })
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      return res.json();
    },
    onSuccess: () => {
      setIsCreating(false);
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => console.error(err),
  });

  const postAnnouncement = () => {
    if (!title || !content) return Alert.alert("Error", "Title and content required");
    createMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/support/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => console.error(err),
  });

  const deleteAnnouncement = (id: string) => {
    Alert.alert("Delete Announcement", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) }
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsCreating(!isCreating)}>
          <IconSymbol name={isCreating ? "xmark" : "plus"} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isCreating ? (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.createForm}>
          <Text style={styles.label}>Audience</Text>
          <View style={styles.audienceRow}>
            <TouchableOpacity 
              style={[styles.audienceBtn, audience === 'coaching_unit' && styles.audienceActive]}
              onPress={() => setAudience('coaching_unit')}
            >
              <Text style={[styles.audienceText, audience === 'coaching_unit' && styles.audienceTextActive]}>Coaching Unit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.audienceBtn, audience === 'school_wide' && styles.audienceActive]}
              onPress={() => setAudience('school_wide')}
            >
              <Text style={[styles.audienceText, audience === 'school_wide' && styles.audienceTextActive]}>School-Wide</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput 
            style={styles.input} 
            value={title} 
            onChangeText={setTitle}
            placeholder="e.g. Mandatory session deadline"
          />

          <Text style={styles.label}>Message</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={content} 
            onChangeText={setContent}
            placeholder="Type your message here..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={postAnnouncement}>
            <Text style={styles.submitBtnText}>Post Announcement</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      ) : loading ? (
        <ActivityIndicator size="large" color="#1A2B4A" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={a => a.id}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#1A2B4A" style={{ margin: 20 }} /> : null}
          ListEmptyComponent={() => (
            <View style={styles.emptyBox}>
              <IconSymbol name="megaphone.fill" size={32} color="#9BA3AE" />
              <Text style={styles.emptyText}>No announcements posted.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetText}>
                      {item.target_audience === 'school_wide' ? 'SCHOOL-WIDE' : 'COACHING ONLY'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteAnnouncement(item.id)}>
                  <IconSymbol name="trash" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.contentText}>{item.content}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4A" },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#C9933A", alignItems: "center", justifyContent: "center" },
  
  listContent: { padding: 20, gap: 16 },
  card: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  targetBadge: { backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  targetText: { fontSize: 10, fontWeight: "800", color: "#3B82F6", letterSpacing: 0.5 },
  dateText: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  titleText: { fontSize: 18, fontWeight: "800", color: "#1A2B4A", marginBottom: 8 },
  contentText: { fontSize: 14, color: "#4B5563", lineHeight: 22 },
  
  emptyBox: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { color: "#9BA3AE", fontSize: 15, fontWeight: "600" },

  createForm: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#1A2B4A", marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 16, fontSize: 15, color: "#111827" },
  textArea: { minHeight: 120 },
  audienceRow: { flexDirection: "row", gap: 12 },
  audienceBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  audienceActive: { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" },
  audienceText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  audienceTextActive: { color: "#3B82F6" },
  
  submitBtn: { backgroundColor: "#1A2B4A", padding: 16, borderRadius: 16, alignItems: "center", marginTop: 32 },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
