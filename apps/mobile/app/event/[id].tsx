import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {  useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { hasRole } from "@/lib/permissions";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Event = {
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
  
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRsvping, setIsRsvping] = useState(false);

  useEffect(() => {
    if (session?.accessToken && id) {
      Promise.all([
        apiRequest<{ event: Event }>(`/events/${id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        apiRequest<{ rsvps: Rsvp[] }>(`/events/${id}/rsvps`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      ])
        .then(([eventRes, rsvpsRes]) => {
          setEvent(eventRes.event);
          setRsvps(rsvpsRes.rsvps || []);
        })
        .catch((err) => console.error("Failed to fetch event:", err))
        .finally(() => setIsLoading(false));
    }
  }, [id, session?.accessToken]);

  const handleRsvp = async (status: string) => {
    if (!session || !event || isRsvping) return;
    setIsRsvping(true);
    try {
      const res = await apiRequest<{ rsvp: any, counts: any }>(`/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ status }),
      });
      
      setEvent(prev => prev ? { 
        ...prev, 
        myRsvp: status,
        goingCount: res.counts.goingCount,
        maybeCount: res.counts.maybeCount,
      } : null);

      // Refresh RSVPs list
      const rsvpsRes = await apiRequest<{ rsvps: Rsvp[] }>(`/events/${event.id}/rsvps`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setRsvps(rsvpsRes.rsvps || []);

    } catch (err) {
      console.error("Failed to RSVP:", err);
    } finally {
      setIsRsvping(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          try {
            await apiRequest(`/posts/${event?.postId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            router.back();
          } catch (err) {
            Alert.alert("Error", "Failed to delete event.");
          }
        }
      }
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A93C40" />
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
  const formattedDate = new Date(event.eventDate).toLocaleDateString(undefined, { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });
  const formattedTime = event.eventTime?.substring(0, 5);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <IconSymbol name="chevron.left" size={28} color="#1A2B4A" />
        </Pressable>
        {isOwner && (
          <Pressable onPress={handleDelete} style={styles.iconBtn}>
            <IconSymbol name="trash.fill" size={24} color="#DC2626" />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 100) }}>
        
        <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeMonth}>{new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
            <Text style={styles.dateBadgeDay}>{new Date(event.eventDate).getDate()}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.organizerText}>by {event.authorName}</Text>
          </View>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBg}>
              <IconSymbol name="calendar" size={18} color="#A93C40" />
            </View>
            <View>
              <Text style={styles.detailLabel}>When</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
              <Text style={styles.detailSubValue}>{formattedTime}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          {!!event.location && (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailIconBg}>
                  <IconSymbol name="mappin.and.ellipse" size={18} color="#A93C40" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Where</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
            </>
          )}

          {!!event.capacity && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconBg}>
                <IconSymbol name="person.3.fill" size={18} color="#A93C40" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Capacity</Text>
                <Text style={styles.detailValue}>{event.goingCount} / {event.capacity} Attendees</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>{event.content}</Text>
        </View>

        {event.rsvpEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Are you going?</Text>
            <View style={styles.rsvpContainer}>
              <Pressable 
                style={[styles.rsvpTile, event.myRsvp === "going" && styles.rsvpTileGoing]}
                onPress={() => handleRsvp("going")}
                disabled={isRsvping}
              >
                <IconSymbol name="checkmark.circle.fill" size={24} color={event.myRsvp === "going" ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.rsvpTileText, event.myRsvp === "going" && styles.rsvpTileTextActive]}>Going</Text>
              </Pressable>

              <Pressable 
                style={[styles.rsvpTile, event.myRsvp === "maybe" && styles.rsvpTileMaybe]}
                onPress={() => handleRsvp("maybe")}
                disabled={isRsvping}
              >
                <IconSymbol name="questionmark.circle.fill" size={24} color={event.myRsvp === "maybe" ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.rsvpTileText, event.myRsvp === "maybe" && styles.rsvpTileTextActive]}>Maybe</Text>
              </Pressable>

              <Pressable 
                style={[styles.rsvpTile, event.myRsvp === "declined" && styles.rsvpTileDeclined]}
                onPress={() => handleRsvp("declined")}
                disabled={isRsvping}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color={event.myRsvp === "declined" ? "#FFFFFF" : "#6B7280"} />
                <Text style={[styles.rsvpTileText, event.myRsvp === "declined" && styles.rsvpTileTextActive]}>No</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.attendeesHeaderRow}>
            <Text style={styles.sectionTitle}>Attendees ({event.goingCount})</Text>
          </View>

          {rsvps.length === 0 ? (
            <View style={styles.emptyAttendees}>
              <IconSymbol name="person.3.fill" size={32} color="#D1D5DB" />
              <Text style={styles.emptyAttendeesText}>No attendees yet.</Text>
            </View>
          ) : (
            <View style={styles.attendeesList}>
              {rsvps.map((rsvp, idx) => (
                <View key={rsvp.userId + idx} style={styles.attendeeRow}>
                  <View style={styles.attendeeAvatar}>
                    <Text style={styles.attendeeAvatarText}>{rsvp.fullName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.attendeeInfo}>
                    <Text style={styles.attendeeName}>{rsvp.fullName}</Text>
                    <Text style={[
                      styles.attendeeStatus, 
                      rsvp.status === "going" ? { color: "#10B981" } : 
                      rsvp.status === "maybe" ? { color: "#F59E0B" } : { color: "#EF4444" }
                    ]}>
                      {rsvp.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
    marginTop: 16,
  },
  dateBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: 64,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  dateBadgeMonth: { fontSize: 13, fontWeight: "800", color: "#A93C40", marginBottom: 2 },
  dateBadgeDay: { fontSize: 24, fontWeight: "800", color: "#1A2B4A" },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A2B4A",
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  organizerText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },

  detailsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { fontSize: 13, color: "#9BA3AE", fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: "700", color: "#1A2B4A" },
  detailSubValue: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  detailDivider: { height: 1, backgroundColor: "#F0F2F5", marginLeft: 64 },

  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4A", marginBottom: 16 },
  description: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 26,
  },
  
  rsvpContainer: {
    flexDirection: "row",
    gap: 12,
  },
  rsvpTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  rsvpTileGoing: { backgroundColor: "#10B981" },
  rsvpTileMaybe: { backgroundColor: "#F59E0B" },
  rsvpTileDeclined: { backgroundColor: "#EF4444" },
  rsvpTileText: { fontSize: 14, fontWeight: "700", color: "#4B5563" },
  rsvpTileTextActive: { color: "#FFFFFF" },
  
  attendeesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  emptyAttendees: {
    padding: 32,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    gap: 12,
  },
  emptyAttendeesText: { color: "#9BA3AE", fontWeight: "500", fontSize: 15 },
  attendeesList: { 
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  attendeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  attendeeAvatarText: { fontSize: 16, fontWeight: "800", color: "#1A2B4A" },
  attendeeInfo: { flex: 1 },
  attendeeName: { fontSize: 16, fontWeight: "700", color: "#1A2B4A" },
  attendeeStatus: { fontSize: 13, fontWeight: "800", marginTop: 2 },
});
