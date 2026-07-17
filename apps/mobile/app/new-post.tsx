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
  Alert,
  ScrollView,
  Switch
} from "react-native"; 
import globalStyles from '../styles';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Group = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
};

export default function NewPostScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { preselectGroup } = useLocalSearchParams<{ preselectGroup?: string }>();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Announcement");
  
  // Event fields
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const standardLocations = ["Library", "Student Center", "Main Quad", "Auditorium", "Other"];
  
  // Targeting fields
  const [isTargeted, setIsTargeted] = useState(false);
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = preselectGroup 
    ? ["Announcement", "Event", "Discussion"] 
    : ["Announcement", "Event", "Alert", "Discussion"];
  const isEvent = category === "Event";

  useEffect(() => {
    // Fetch groups for targeting (only groups where user is leader)
    if (session?.accessToken) {
      apiRequest<{ groups: (Group & { isLeader?: boolean })[] }>("/groups/my", {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      })
        .then(res => {
          const myLedGroups = res.groups?.filter(g => g.isLeader) || [];
          setGroups(myLedGroups);
          // Auto-select group if preselectGroup is provided
          if (preselectGroup) {
            setIsTargeted(true);
            setTargetGroupIds([preselectGroup]);
          }
        })
        .catch(err => console.error("Failed to fetch groups", err));
    }
  }, [session?.accessToken, preselectGroup]);

  const toggleGroup = (groupId: string) => {
    setTargetGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Title and content are required.");
      return;
    }

    if (isEvent && !eventDate) {
      Alert.alert("Error", "Event date and time are required for events.");
      return;
    }
    
    if (isTargeted && targetGroupIds.length === 0) {
      Alert.alert("Error", "Please select at least one target group.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isEvent ? "/events" : "/posts";
      const payload: any = {
        title,
        content,
        category,
        visibility: isTargeted ? "targeted" : "public",
        targetGroupIds: isTargeted ? targetGroupIds : [],
      };

      if (isEvent) {
        payload.eventDate = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD
        payload.eventTime = eventDate.toTimeString().split(" ")[0].substring(0, 5); // HH:MM
        payload.location = selectedLocation === "Other" ? customLocation : selectedLocation;
        payload.capacity = capacity ? parseInt(capacity, 10) : null;
        payload.rsvpEnabled = rsvpEnabled;
      }

      await apiRequest(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      
      // Go back to the feed
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", (error as Error).message || "Failed to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text style={styles.headerTitle}>New Update</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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

          {/* Visibility Controls */}
          {preselectGroup ? (
            <View style={styles.fixedTargetContainer}>
              <IconSymbol name="person.2.fill" size={20} color="#4F46E5" />
              <Text style={styles.fixedTargetText}>
                Posting to club members
              </Text>
            </View>
          ) : (
            <>
              {/* Visibility Toggle */}
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>Targeted Post</Text>
                  <Text style={styles.toggleDesc}>Limit visibility to specific groups</Text>
                </View>
                <Switch
                  value={isTargeted}
                  onValueChange={setIsTargeted}
                  trackColor={{ false: "#E5E7EB", true: "#A93C40" }}
                />
              </View>

              {isTargeted && (
                <View style={styles.groupsContainer}>
                  <Text style={styles.sectionSubtitle}>Select Target Groups</Text>
                  <View style={styles.groupsGrid}>
                    {groups.map(g => (
                      <Pressable
                        key={g.id}
                        style={[styles.groupChip, targetGroupIds.includes(g.id) && styles.groupChipSelected]}
                        onPress={() => toggleGroup(g.id)}
                      >
                        <Text style={[styles.groupChipText, targetGroupIds.includes(g.id) && styles.groupChipTextSelected]}>
                          {g.name}
                        </Text>
                      </Pressable>
                    ))}
                    {groups.length === 0 && (
                      <Text style={{ color: "#6b7280", fontStyle: "italic", marginTop: 8 }}>
                        You don't lead any clubs yet.
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={styles.divider} />

          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#9BA3AE"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          
          <TextInput
            style={[styles.contentInput, { minHeight: 120 }]}
            placeholder={isEvent ? "Describe your event..." : "What's happening on campus?"}
            placeholderTextColor="#9BA3AE"
            value={content}
            onChangeText={setContent}
            multiline
          />

          {isEvent && (
            <View style={styles.eventSection}>
              <Text style={styles.sectionSubtitle}>Event Details</Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <Pressable style={styles.detailInput} onPress={() => setShowDatePicker(true)}>
                    <Text style={{ color: "#1A2B4A" }}>{eventDate.toLocaleDateString()}</Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={eventDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setEventDate(date);
                      }}
                    />
                  )}
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <Pressable style={styles.detailInput} onPress={() => setShowTimePicker(true)}>
                    <Text style={{ color: "#1A2B4A" }}>
                      {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Pressable>
                  {showTimePicker && (
                    <DateTimePicker
                      value={eventDate}
                      mode="time"
                      display="default"
                      onChange={(event, date) => {
                        setShowTimePicker(false);
                        if (date) setEventDate(date);
                      }}
                    />
                  )}
                </View>
              </View>

              <Text style={styles.inputLabel}>Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {standardLocations.map(loc => (
                  <Pressable
                    key={loc}
                    style={[styles.locationChip, selectedLocation === loc && styles.locationChipSelected]}
                    onPress={() => setSelectedLocation(loc)}
                  >
                    <Text style={[styles.locationChipText, selectedLocation === loc && styles.locationChipTextSelected]}>
                      {loc}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {selectedLocation === "Other" && (
                <TextInput
                  style={[styles.detailInput, { marginBottom: 16 }]}
                  placeholder="Enter custom location..."
                  value={customLocation}
                  onChangeText={setCustomLocation}
                />
              )}

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Capacity (Optional)</Text>
                  <TextInput
                    style={styles.detailInput}
                    placeholder="e.g. 50"
                    keyboardType="numeric"
                    value={capacity}
                    onChangeText={setCapacity}
                  />
                </View>
              </View>

              <View style={[styles.toggleRow, { paddingHorizontal: 0, marginTop: 8 }]}>
                <View>
                  <Text style={styles.toggleLabel}>Enable RSVP</Text>
                  <Text style={styles.toggleDesc}>Allow users to confirm attendance</Text>
                </View>
                <Switch
                  value={rsvpEnabled}
                  onValueChange={setRsvpEnabled}
                  trackColor={{ false: "#E5E7EB", true: "#A93C40" }}
                />
              </View>
            </View>
          )}
          
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable 
            style={[styles.submitBtn, (!title.trim() || !content.trim() || isSubmitting) && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{isEvent ? "Create Event" : "Post Update"}</Text>
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
    backgroundColor: "#FFFFFF",
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
    color: "#4b5563",
  },
  fixedTargetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  fixedTargetText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    flex: 1,
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
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2B4A",
  },
  toggleDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  groupsContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 12,
  },
  groupsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  groupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  groupChipSelected: {
    backgroundColor: "#1A2B4A",
    borderColor: "#1A2B4A",
  },
  groupChipText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  groupChipTextSelected: {
    color: "#FFFFFF",
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 16,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F2F5",
    marginVertical: 16,
  },
  contentInput: {
    fontSize: 18,
    color: "#4B5563",
    textAlignVertical: "top",
    marginBottom: 24,
  },
  eventSection: {
    backgroundColor: "#FFFFFF",
    padding: 0,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  detailInput: {
    backgroundColor: "#F0F2F5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1A2B4A",
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    marginRight: 8,
  },
  locationChipSelected: {
    backgroundColor: "#1A2B4A",
  },
  locationChipText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
  },
  locationChipTextSelected: {
    color: "#FFFFFF",
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
