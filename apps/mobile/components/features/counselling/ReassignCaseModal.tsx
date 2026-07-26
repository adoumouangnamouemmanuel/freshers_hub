import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { IconSymbol } from "../../ui/icon-symbol";
import { useAuth } from "../../../context/auth-context";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { apiRequest, API_URL } from "../../../lib/api";

type ReassignCaseModalProps = {
  visible: boolean;
  onClose: () => void;
  assignmentId: string;
  currentPeerId: string;
  studentName: string;
  onSuccess: () => void;
};

const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return API_URL + url;
};

export default function ReassignCaseModal({ visible, onClose, assignmentId, currentPeerId, studentName, onSuccess }: ReassignCaseModalProps) {
  const { session } = useAuth();
  const token = session?.accessToken;

  const [peerCounsellors, setPeerCounsellors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && token) {
      setLoading(true);
      fetch(`${API_URL}/support/counselling/peer-counsellors`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setPeerCounsellors(data || []);
      })
      .catch(() => {
        Alert.alert("Error", "Could not fetch peer counsellors");
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [visible, token]);

  const handleReassign = async (peerId: string) => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/support/counselling/assignments/${assignmentId}/reassign`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ peerCounsellorId: peerId })
      });
      if (!res.ok) throw new Error("Failed to reassign");
      
      Alert.alert("Success", `Case reassigned successfully.`);
      onSuccess();
      onClose();
    } catch (err) {
      Alert.alert("Error", "Could not reassign case");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <View style={styles.modalOverlayBg}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
          
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reassign Case</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Select a new peer counsellor for <Text style={styles.boldText}>{studentName}</Text>.
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4F46E5" />
              </View>
            ) : (
              <ScrollView style={styles.peerList} showsVerticalScrollIndicator={false}>
                {peerCounsellors.filter(p => p.id !== currentPeerId).map((peer) => (
                  <TouchableOpacity 
                    key={peer.id} 
                    style={styles.peerCard}
                    onPress={() => handleReassign(peer.id)}
                    disabled={submitting}
                  >
                    <Image 
                      source={{ uri: resolveImageUrl(peer.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(peer.name)}&background=random` }} 
                      style={styles.avatar}
                    />
                    <View style={styles.peerInfo}>
                      <Text style={styles.peerName}>{peer.name}</Text>
                      <Text style={styles.peerEmail}>{peer.email}</Text>
                    </View>
                    <IconSymbol name="arrow.right" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
                {peerCounsellors.filter(p => p.id !== currentPeerId).length === 0 && (
                  <Text style={styles.emptyText}>No other peer counsellors available.</Text>
                )}
              </ScrollView>
            )}

            {submitting && (
              <View style={styles.submittingOverlay}>
                <ActivityIndicator size="large" color="#4F46E5" />
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1 },
  modalOverlayBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: "#FFFFFF", width: "90%", maxHeight: "80%", borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  closeButton: { padding: 4 },
  infoBox: { backgroundColor: "#EEF2FF", padding: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12 },
  infoText: { color: "#4338CA", fontSize: 14, lineHeight: 20 },
  boldText: { fontWeight: "700" },
  loadingContainer: { padding: 40, alignItems: "center" },
  peerList: { padding: 20 },
  peerCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E5E7EB" },
  peerInfo: { flex: 1, marginLeft: 12 },
  peerName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  peerEmail: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  emptyText: { textAlign: "center", color: "#6B7280", marginVertical: 20 },
  submittingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.7)", justifyContent: "center", alignItems: "center" },
});
