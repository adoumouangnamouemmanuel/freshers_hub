/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Alert, Modal, FlatList } from "react-native";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { hasRole } from "@/lib/permissions";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Event = {
  isOnline: string | undefined;
  reminderMinutes: any;
  endDate: string | number | Date;
  endTime: any;
  isAllDay: any;
  id: string;
  postId: string;
  title: string;
  content: string;
  eventDate: string;
  eventTime: string;
  location: string;
  organizer: string;
  capacity: number;
  rsvpEnabled: boolean;
  status: string;
  authorName: string;
  authorId: string;
  authorAvatar: string | null;
  createdAt: string;
  goingCount: number;
  maybeCount: number;
  myRsvp: string | null;
  meetingLink?: string;
};

type Rsvp = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  rsvpAt: string;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  
  const queryClient = useQueryClient();
  const [isRsvping, setIsRsvping] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await apiRequest<{ event: Event }>(`/events/${id}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      return res.event;
    },
    enabled: !!session?.accessToken && !!id,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: rsvpsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['event_rsvps', id],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiRequest<{ rsvps: Rsvp[] }>(`/events/${id}/rsvps?page=${pageParam}&limit=10`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      return res.rsvps || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length + 1 : undefined;
    },
    enabled: !!session?.accessToken && !!id,
    initialPageParam: 1
  });

  const allRsvps = rsvpsData?.pages.flatMap(page => page) || [];

  const rsvpMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!event) throw new Error("Event not found");
      return apiRequest<{ rsvp: any, counts: any }>(`/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event_rsvps', id] });
    },
    onError: (err) => {
      console.error("Failed to RSVP:", err);
    },
    onSettled: () => {
      setIsRsvping(false);
    }
  });

  const handleRsvp = (status: string) => {
    if (!session || !event || isRsvping) return;
    setIsRsvping(true);
    rsvpMutation.mutate(status);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/posts/${event?.postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.back();
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete event.");
    }
  });

  const handleDelete = () => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: () => deleteMutation.mutate()
      }
    ]);
  };

  if (isEventLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <IconSymbol name="calendar" size={48} color="#D1D5DB" />
        <Text style={styles.errorText}>Event not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtnFallback}>
          <Text style={styles.backBtnFallbackText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwner = session?.user.id === event.authorId || hasRole(session?.user.roles || [], "admin");
  
  const eventDateObj = new Date(event.eventDate);
  const formattedDate = eventDateObj.toLocaleDateString(undefined, { 
    weekday: 'short', month: 'short', day: 'numeric' 
  });
  const formattedTime = event.isAllDay ? "All Day" : (event.eventTime?.substring(0, 5) || "");

  let formattedEndDate = formattedDate;
  let formattedEndTime = event.isAllDay ? "All Day" : (event.endTime?.substring(0, 5) || "");
  if (event.endDate) {
    const endObj = new Date(event.endDate);
    formattedEndDate = endObj.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <IconSymbol name="chevron.left" size={24} color="#374151" />
        </Pressable>
        {isOwner && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => router.push(`/edit-post/${event.id}?type=event`)} style={styles.iconBtn}>
              <IconSymbol name="pencil" size={20} color="#374151" />
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.iconBtn}>
              <IconSymbol name="trash" size={20} color="#374151" />
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 100) }}>
        
        {/* Title */}
        <View style={styles.titleSection}>
          <View style={styles.colorIndicator} />
          <Text style={styles.title}>{event.title}</Text>
        </View>

        {/* Info List */}
        <View style={styles.infoList}>
          {/* Time Block */}
          <View style={styles.infoRow}>
            <IconSymbol name="clock" size={20} color="#4B5563" />
            <View style={styles.infoRowContent}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeBlockDate}>{formattedDate}</Text>
                <Text style={styles.timeBlockTime}>{formattedTime}</Text>
              </View>
              <IconSymbol name="arrow.right" size={14} color="#9CA3AF" style={{ marginHorizontal: 16 }} />
              <View style={styles.timeBlock}>
                <Text style={styles.timeBlockDate}>{formattedEndDate}</Text>
                <Text style={styles.timeBlockTime}>{formattedEndTime}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Timezone */}
          <View style={styles.infoRow}>
            <IconSymbol name="globe" size={20} color="#4B5563" />
            <View style={styles.infoRowContent}>
              <Text style={styles.primaryInfoText}>(GMT+0) Greenwich Mean Time</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Organizer */}
          <View style={styles.infoRow}>
            <IconSymbol name="calendar.badge.clock" size={20} color="#4B5563" />
            <View style={styles.infoRowContent}>
              <Text style={styles.primaryInfoText}>{event.authorName}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Location / Meeting Link */}
          {(event.location || event.meetingLink || event.isOnline) && (
            <>
              <View style={styles.infoRow}>
                <IconSymbol name={event.isOnline ? "video.fill" : "mappin.and.ellipse"} size={20} color="#4B5563" />
                <View style={styles.infoRowContent}>
                  <Text style={styles.primaryInfoText}>
                    {event.isOnline ? "Online Meeting" : (event.location || "Location TBD")}
                  </Text>
                  {event.isOnline && event.meetingLink && (
                     <Text style={[styles.secondaryInfoText, { color: '#2563EB' }]}>{event.meetingLink}</Text>
                  )}
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Reminder */}
          {!!event.reminderMinutes && (
            <>
              <View style={styles.infoRow}>
                <IconSymbol name="bell" size={20} color="#4B5563" />
                <View style={styles.infoRowContent}>
                  <Text style={styles.primaryInfoText}>{event.reminderMinutes} minutes before</Text>
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Capacity */}
          {!!event.capacity && (
            <>
              <View style={styles.infoRow}>
                <IconSymbol name="person.3.fill" size={20} color="#4B5563" />
                <View style={styles.infoRowContent}>
                  <Text style={styles.primaryInfoText}>{event.goingCount} / {event.capacity} Attendees</Text>
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Description */}
          <View style={styles.infoRow}>
            <IconSymbol name="text.justifyleft" size={20} color="#4B5563" />
            <View style={styles.infoRowContent}>
              <Text style={styles.primaryInfoText}>{event.content}</Text>
            </View>
          </View>
        </View>

        {/* Participants Summary Section */}
        {event.rsvpEnabled && (
          <View style={styles.participantsSection}>
            <View style={styles.participantsHeader}>
              <Text style={styles.participantsTitle}>Guests</Text>
              <Text style={styles.participantsCounts}>
                {event.goingCount} yes, {event.maybeCount} maybe
              </Text>
            </View>
            
            <View style={styles.avatarsRow}>
              {allRsvps.slice(0, 5).map((rsvp, idx) => (
                <View key={rsvp.userId + idx} style={[styles.miniAvatar, { zIndex: 10 - idx, marginLeft: idx > 0 ? -12 : 0 }]}>
                  <Text style={styles.miniAvatarText}>{rsvp.fullName.charAt(0).toUpperCase()}</Text>
                </View>
              ))}
              {allRsvps.length > 5 && (
                <View style={[styles.miniAvatar, styles.miniAvatarMore, { zIndex: 0, marginLeft: -12 }]}>
                  <Text style={styles.miniAvatarMoreText}>+{allRsvps.length - 5}</Text>
                </View>
              )}
              {allRsvps.length === 0 && (
                <Text style={{ color: '#6B7280', fontStyle: 'italic', fontSize: 14 }}>No guests yet.</Text>
              )}
            </View>
            
            {allRsvps.length > 0 && (
              <Pressable onPress={() => setIsParticipantsModalOpen(true)} style={styles.viewMoreBtn}>
                <Text style={styles.viewMoreBtnText}>View more</Text>
                <IconSymbol name="chevron.right" size={16} color="#4285F4" />
              </Pressable>
            )}
          </View>
        )}

      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBarContainer, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
        <View style={styles.bottomBar}>
          {event.rsvpEnabled ? (
            <>
              <Pressable 
                style={styles.bottomBarAction}
                onPress={() => handleRsvp("going")}
              >
                <IconSymbol name="checkmark" size={22} color={event.myRsvp === "going" ? "#10B981" : "#6B7280"} />
                <Text style={[styles.bottomBarActionText, event.myRsvp === "going" && { color: "#10B981" }]}>Going</Text>
              </Pressable>
              <Pressable 
                style={styles.bottomBarAction}
                onPress={() => handleRsvp("maybe")}
              >
                <IconSymbol name="questionmark" size={22} color={event.myRsvp === "maybe" ? "#F59E0B" : "#6B7280"} />
                <Text style={[styles.bottomBarActionText, event.myRsvp === "maybe" && { color: "#F59E0B" }]}>Maybe</Text>
              </Pressable>
              <Pressable 
                style={styles.bottomBarAction}
                onPress={() => handleRsvp("declined")}
              >
                <IconSymbol name="xmark" size={22} color={event.myRsvp === "declined" ? "#EF4444" : "#6B7280"} />
                <Text style={[styles.bottomBarActionText, event.myRsvp === "declined" && { color: "#EF4444" }]}>No</Text>
              </Pressable>
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>RSVP is disabled for this event</Text>
            </View>
          )}
        </View>
      </View>

      {/* Participants Modal */}
      <Modal
        visible={isParticipantsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsParticipantsModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.modalTitle}>Guests</Text>
            <Pressable onPress={() => setIsParticipantsModalOpen(false)} style={styles.modalCloseBtn}>
              <IconSymbol name="xmark" size={24} color="#111827" />
            </Pressable>
          </View>
          
          <FlatList
            data={allRsvps}
            keyExtractor={(item, index) => item.userId + index}
            contentContainerStyle={styles.modalListContent}
            renderItem={({ item }) => (
              <View style={styles.attendeeRow}>
                <View style={styles.attendeeAvatar}>
                  <Text style={styles.attendeeAvatarText}>{item.fullName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.attendeeInfo}>
                  <Text style={styles.attendeeName}>{item.fullName}</Text>
                  <Text style={[
                    styles.attendeeStatus, 
                    item.status === "going" ? { color: "#10B981" } : 
                    item.status === "maybe" ? { color: "#F59E0B" } : { color: "#EF4444" }
                  ]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} /> : null
            )}
          />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", gap: 16 },
  errorText: { fontSize: 18, color: "#374151", fontWeight: "600" },
  backBtnFallback: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#F3F4F6", borderRadius: 12 },
  backBtnFallbackText: { color: "#374151", fontWeight: "600" },
  
  content: { 
    flex: 1,
  },
  
  titleSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EA4335", // Red/orange color
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    color: "#1F2937",
    fontWeight: "400",
    flex: 1,
    lineHeight: 32,
  },

  infoList: {
    paddingHorizontal: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    gap: 16,
  },
  infoRowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  primaryInfoText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
  secondaryInfoText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 36,
  },

  timeBlock: {
    flex: 1,
  },
  timeBlockDate: {
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 4,
  },
  timeBlockTime: {
    fontSize: 14,
    color: "#4B5563",
  },

  participantsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  participantsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  participantsCounts: {
    fontSize: 14,
    color: "#6B7280",
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  miniAvatarMore: {
    backgroundColor: "#E5E7EB",
  },
  miniAvatarMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 4,
  },
  viewMoreBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4285F4",
  },

  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 100, // Fully rounded pill shape
    paddingVertical: 8,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  bottomBarAction: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  bottomBarActionText: {
    fontSize: 11,
    fontWeight: "400",
    color: "#6B7280",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalListContent: {
    padding: 20,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  attendeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  attendeeAvatarText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  attendeeInfo: { flex: 1 },
  attendeeName: { fontSize: 16, fontWeight: "500", color: "#111827" },
  attendeeStatus: { fontSize: 13, fontWeight: "600", marginTop: 2 },
});
