import React, { useState } from 'react';
import { Pressable, View, Text } from 'react-native'; 
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { apiRequest } from '@/lib/api';
import { hasRole } from '@/lib/permissions';
import { Post } from '../../hooks/useDashboardData';
import { styles } from './DashboardStyles';

export function PostCard({ post, onUpdate }: { post: Post; onUpdate: () => void }) {
  const router = useRouter();
  const { session } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  
  const isLong = post.content.length > 120;
  const displayContent = !isLong || expanded ? post.content : post.content.slice(0, 120) + "...";
  const isAlert = post.category?.toLowerCase() === "alert";
  const isEvent = post.category?.toLowerCase() === "event" && post.eventId;
  const isOwner = session?.user.id === post.authorId || hasRole(session?.user.roles || [], "admin");

  const handleRsvp = async (status: string) => {
    if (!session || !post.eventId || isRsvping) return;
    setIsRsvping(true);
    try {
      await apiRequest(`/events/${post.eventId}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ status }),
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to RSVP:", err);
    } finally {
      setIsRsvping(false);
    }
  };

  const formattedEventDate = post.eventDate 
    ? new Date(post.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : "";

  return (
    <Pressable 
      style={[styles.postCard, isAlert && styles.alertCard]} 
      onPress={() => {
        if (isEvent) {
          router.push({ pathname: "/event/[id]", params: { id: post.eventId } } as any);
        } else if (isOwner) {
          router.push({ pathname: "/post/[id]", params: { id: post.id } } as any);
        } else if (isLong) {
          setExpanded(!expanded);
        }
      }}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthorAvatar}>
          <Text style={styles.postAuthorInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>{post.authorName}</Text>
          <Text style={styles.postDate}>
            {new Date(post.createdAt).toLocaleDateString()} • {post.category}
            {post.visibility === "targeted" && " • Targeted"}
          </Text>
        </View>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>
        {displayContent}
        {isLong && !expanded && <Text style={styles.viewMoreInline}> View more</Text>}
      </Text>

      {isEvent && (
        <View style={styles.eventContainer}>
          <View style={styles.eventDetailsRow}>
            <IconSymbol name="calendar" size={14} color="#6B7280" />
            <Text style={styles.eventDetailsText}>
              {formattedEventDate} at {post.eventTime?.substring(0, 5)}
            </Text>
          </View>
          {!!post.eventLocation && (
            <View style={styles.eventDetailsRow}>
              <IconSymbol name="mappin.and.ellipse" size={14} color="#6B7280" />
              <Text style={styles.eventDetailsText}>{post.eventLocation}</Text>
            </View>
          )}
          {!!post.eventOrganizer && (
            <View style={styles.eventDetailsRow}>
              <IconSymbol name="person.fill" size={14} color="#6B7280" />
              <Text style={styles.eventDetailsText}>By {post.eventOrganizer}</Text>
            </View>
          )}
          {!!post.dressCode && (
            <View style={styles.eventDetailsRow}>
              <IconSymbol name="figure.stand" size={14} color="#6B7280" />
              <Text style={styles.eventDetailsText}>Dress code: {post.dressCode}</Text>
            </View>
          )}
          
          <View style={styles.eventFooter}>
            <Text style={styles.attendeeCount}>
              {post.goingCount || 0} attending
            </Text>
            {post.rsvpEnabled && (
              <View style={styles.rsvpActions}>
                <Pressable
                  style={[styles.rsvpBtn, post.myRsvp === "going" && styles.rsvpBtnActive]}
                  onPress={() => handleRsvp(post.myRsvp === "going" ? "declined" : "going")}
                  disabled={isRsvping}
                >
                  <Text style={[styles.rsvpBtnText, post.myRsvp === "going" && styles.rsvpBtnTextActive]}>
                    {post.myRsvp === "going" ? "Going" : "RSVP"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}
