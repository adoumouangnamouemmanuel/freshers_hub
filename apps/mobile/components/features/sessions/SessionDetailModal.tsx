import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform, KeyboardAvoidingView, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiRequest } from "@/lib/api";
import { getProviderRoleLabel } from "@/lib/session-utils";

type Session = any;

type SessionDetailModalProps = {
  session: Session | null;
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
  currentUserId?: string;
  accessToken?: string;
  isCounsellorView?: boolean;
  currentUserRoles?: any[];
};

export default function SessionDetailModal({ session, visible, onClose, onRefresh, currentUserId, accessToken, isCounsellorView, currentUserRoles = [] }: SessionDetailModalProps) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [peerCounsellors, setPeerCounsellors] = useState<any[]>([]);

  // Edit Form State
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (session) {
      setEditDate(new Date(session.date || session.scheduled_at || new Date()));
      setEditLocation(session.location || "");
      setEditDescription(session.description || "");
      setEditTitle(session.title || "");
      setIsEditMode(false);
      setIsAssigning(false);
    }
  }, [session]);

  useEffect(() => {
    const isStrictCounsellor = currentUserRoles.some(r => r?.name === 'counsellor' || r === 'counsellor');
    if (isStrictCounsellor && visible) {
      // Fetch peer counsellors
      apiRequest<any[]>('/support/counselling/peer-counsellors', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(res => setPeerCounsellors(res || [])).catch(console.error);
    }
  }, [currentUserRoles, visible]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setEditDate(selectedDate);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) setEditDate(selectedDate);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!session || !accessToken) return;
    setIsSaving(true);
    try {
      await apiRequest(`/support/sessions/${session.id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status })
      });
      onRefresh();
      onClose();
    } catch (err) {
      Alert.alert("Error", "Could not update session status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignPeer = async (peerId: string) => {
    if (!session || !accessToken) return;
    setIsSaving(true);
    try {
      await apiRequest('/support/counselling/assignments', {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          studentId: session.student_id,
          peerCounsellorId: peerId
        })
      });
      // Mark as completed
      await apiRequest(`/support/sessions/${session.id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status: 'completed' })
      });
      onRefresh();
      onClose();
    } catch (err) {
      Alert.alert("Error", "Could not assign peer counsellor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!session || !accessToken) return;
    setIsSaving(true);
    try {
      await apiRequest(`/support/sessions/${session.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          scheduledAt: editDate.toISOString(),
          location: editLocation,
          description: editDescription,
          title: editTitle
        })
      });
      setIsEditMode(false);
      onRefresh();
      onClose();
    } catch (err) {
      Alert.alert("Error", "Could not save session changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive",
          onPress: async () => {
            if (!session || !accessToken) return;
            try {
              await apiRequest(`/support/sessions/${session.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              onRefresh();
              onClose();
            } catch (err) {
              Alert.alert("Error", "Could not delete session");
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (!session) return null;

  const isParticipant = currentUserId ? (currentUserId === session.student_id || currentUserId === session.provider_id) : false;
  const isProvider = currentUserId ? (currentUserId === session.provider_id) : false;
  const isOwner = currentUserId && session.created_by ? currentUserId === session.created_by : false;

  const hasRole = (roleName: string) => currentUserRoles.some(r => r?.name === roleName || r === roleName);
  const isCoachAdmin = hasRole('coach_admin');
  const isAdvisor = hasRole('advisor');
  const isCounsellor = hasRole('counsellor');
  const isPeerCoach = hasRole('peer_coach');

  const canMarkComplete = isOwner || (isParticipant && (isCoachAdmin || isAdvisor || isCounsellor)) || (isProvider && isPeerCoach);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? "Edit Session" : "Session Details"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 60 }}>
            {isEditMode ? (
              <View style={styles.form}>
                <Text style={styles.label}>Date & Time</Text>
                <View style={styles.datePickerContainer}>
                  <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                    <IconSymbol name="calendar" size={18} color="#6B7280" style={styles.inputIcon} />
                    <Text style={styles.inputText}>
                      {editDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </Pressable>
                  
                  <Pressable style={styles.dateInput} onPress={() => setShowTimePicker(true)}>
                    <IconSymbol name="clock.fill" size={18} color="#6B7280" style={styles.inputIcon} />
                    <Text style={styles.inputText}>
                      {editDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Pressable>
                </View>

                {(showDatePicker || Platform.OS === 'ios') && showDatePicker && (
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}
                
                {(showTimePicker || Platform.OS === 'ios') && showTimePicker && (
                  <DateTimePicker
                    value={editDate}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                  />
                )}
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={[styles.input, !isOwner && { backgroundColor: '#E5E7EB', color: '#6B7280' }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. Initial Consultation"
                  placeholderTextColor="#9CA3AF"
                  editable={isOwner}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput 
                  style={styles.input} 
                  value={editLocation} 
                  onChangeText={setEditLocation}
                  placeholder="e.g. Room 101 or Zoom Link"
                />

                <Text style={styles.label}>Description / Notes</Text>
                <TextInput 
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }, !isOwner && { backgroundColor: '#E5E7EB', color: '#6B7280' }]} 
                  value={editDescription} 
                  onChangeText={setEditDescription}
                  placeholder="Any additional notes..."
                  multiline
                  editable={isOwner}
                />
              </View>
            ) : isAssigning ? (
              <View style={styles.form}>
                <Text style={styles.label}>Select Peer Counsellor</Text>
                <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12 }}>
                  Assigning a peer counsellor will automatically complete this session.
                </Text>
                {peerCounsellors.map(peer => (
                  <TouchableOpacity
                    key={peer.id}
                    style={{ padding: 12, backgroundColor: "#F3F4F6", borderRadius: 8, marginBottom: 8 }}
                    onPress={() => handleAssignPeer(peer.id)}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{peer.name}</Text>
                    <Text style={{ fontSize: 14, color: "#6B7280" }}>{peer.email}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.detailsView}>
                {session.title ? (
                  <View style={styles.detailBlock}>
                    <View style={styles.detailLabelRow}>
                      <Ionicons name="text-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailLabel}>Title</Text>
                    </View>
                    <Text style={styles.detailValue}>{session.title}</Text>
                  </View>
                ) : null}
                <View style={styles.detailBlock}>
                  <View style={styles.detailLabelRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailLabel}>{!isParticipant ? "Participants" : "With"}</Text>
                  </View>
                  {!isParticipant ? (
                    <View style={{ gap: 6, marginTop: 4 }}>
                      <Text style={styles.detailValue}>
                        • {session.student_name} <Text style={{ fontSize: 14, color: "#6B7280" }}>(Fresher)</Text>
                      </Text>
                      <Text style={styles.detailValue}>
                        • {session.provider_name} <Text style={{ fontSize: 14, color: "#6B7280" }}>({getProviderRoleLabel(session.unit_id, session.type)})</Text>
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.detailValue}>
                      {session.provider_id === currentUserId 
                        ? session.student_name 
                        : session.provider_name}
                    </Text>
                  )}
                </View>
                
                <View style={styles.detailBlock}>
                  <View style={styles.detailLabelRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailLabel}>Date & Time</Text>
                  </View>
                  <Text style={styles.detailValue}>{formatDate(session.date || session.scheduled_at)} at {formatTime(session.date || session.scheduled_at)}</Text>
                </View>

                <View style={styles.detailBlock}>
                  <View style={styles.detailLabelRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailLabel}>Location</Text>
                  </View>
                  <Text style={styles.detailValue}>{session.location || 'TBA'}</Text>
                </View>

                <View style={styles.detailBlock}>
                  <View style={styles.detailLabelRow}>
                    <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailLabel}>Description / Notes</Text>
                  </View>
                  <Text style={styles.detailValue}>{session.description || 'No additional notes.'}</Text>
                </View>

                <View style={styles.detailBlock}>
                  <View style={styles.detailLabelRow}>
                    <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailLabel}>Status</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {session.status === 'scheduled' ? 'Scheduled' : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {isEditMode ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.modalBtnAlt} onPress={() => setIsEditMode(false)}>
                  <Text style={styles.modalBtnAltText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <ActivityIndicator color="#FFF"/> : <Text style={styles.modalBtnPrimaryText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            ) : isAssigning ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.modalBtnAlt} onPress={() => setIsAssigning(false)}>
                  <Text style={styles.modalBtnAltText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {isCounsellor && session.status === 'scheduled' && (
                  <View style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#4F46E5', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 }} 
                      onPress={() => setIsAssigning(true)}
                      disabled={isSaving}
                    >
                      <Ionicons name="people" size={20} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Assign to Peer Counsellor</Text>
                    </TouchableOpacity>
                    <Text style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#6B7280' }}>
                      Hand this session over to a peer counsellor for follow-up.
                    </Text>
                  </View>
                )}

                {canMarkComplete && (session.status === 'scheduled' || session.status === 'overdue') && (
                  <TouchableOpacity 
                    style={styles.modalBtnSuccess} 
                    onPress={() => handleUpdateStatus('completed')}
                    disabled={isSaving}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.modalBtnPrimaryText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}

                {session.status === 'completed' && !session.has_report && isParticipant && currentUserId === session.provider_id && (
                  <TouchableOpacity 
                    style={styles.modalBtnPrimary}
                    onPress={() => {
                      onClose();
                      router.push(`/my-coaching/report?sessionId=${session.id}&fresherName=${encodeURIComponent(session.student_name || 'Fresher')}` as any);
                    }}
                  >
                    <Ionicons name="document-text" size={20} color="#FFFFFF" />
                    <Text style={styles.modalBtnPrimaryText}>Submit Report</Text>
                  </TouchableOpacity>
                )}
                
                {(isOwner || isProvider) && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setIsEditMode(true)}>
                      <Ionicons name="pencil" size={20} color="#4B5563" />
                      <Text style={styles.modalBtnSecondaryText}>{isOwner ? "Edit" : "Reschedule"}</Text>
                    </TouchableOpacity>
                    {isOwner && (
                      <TouchableOpacity style={styles.modalBtnDanger} onPress={handleDelete}>
                        <Ionicons name="trash" size={20} color="#B91C1C" />
                        <Text style={styles.modalBtnDangerText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "90%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  closeBtn: { padding: 4, backgroundColor: "#F3F4F6", borderRadius: 20 },
  modalBody: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  
  detailsView: { gap: 24 },
  detailBlock: { gap: 6 },
  detailLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", textTransform: "uppercase" },
  detailValue: { fontSize: 16, color: "#1F2937", fontWeight: "500", marginLeft: 22 },
  
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151" },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 15, color: "#1F2937" },
  datePickerContainer: { flexDirection: "row", gap: 12 },
  dateInput: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, gap: 8 },
  inputIcon: { opacity: 0.7 },
  inputText: { fontSize: 15, color: "#1F2937" },
  
  modalFooter: { padding: 24, paddingBottom: 36, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#FFFFFF", gap: 12 },
  actionRow: { flexDirection: "row", gap: 12 },
  modalBtnPrimary: { flex: 1, backgroundColor: "#A93C40", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  modalBtnPrimaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  modalBtnAlt: { flex: 1, backgroundColor: "#F3F4F6", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  modalBtnAltText: { color: "#4B5563", fontSize: 16, fontWeight: "700" },
  modalBtnSuccess: { flexDirection: "row", backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 8 },
  modalBtnSecondary: { flex: 1, flexDirection: "row", backgroundColor: "#F3F4F6", paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 8 },
  modalBtnSecondaryText: { color: "#4B5563", fontSize: 16, fontWeight: "700" },
  modalBtnDanger: { flex: 1, flexDirection: "row", backgroundColor: "#FEF2F2", paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 8 },
  modalBtnDangerText: { color: "#B91C1C", fontSize: 16, fontWeight: "700" }
});
