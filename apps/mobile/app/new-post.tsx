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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  isLeader?: boolean;
};

interface Location {
  id: string;
  name: string;
}

export default function NewPostScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { preselectGroup, category: initialCategory } = useLocalSearchParams<{ preselectGroup?: string, category?: string }>();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(initialCategory || "Announcement");
  
  // Event fields
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  
  const [showPicker, setShowPicker] = useState<'start_date'|'start_time'|'end_date'|'end_time'|null>(null);
  
  // Location / Online
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  
  const [capacity, setCapacity] = useState("");
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  
  // Other fields
  const [reminder, setReminder] = useState<number | null>(15);
  
  // Targeting fields
  const queryClient = useQueryClient();
  const [isTargeted, setIsTargeted] = useState(false);
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = preselectGroup 
    ? ["Announcement", "Event", "Discussion"] 
    : ["Announcement", "Event", "Alert", "Discussion"];
  const isEvent = category === "Event";
  const roles = session?.user.roles || [];
  const isPeerCoach = roles.some((r: any) => r.name === "peer_coach");
  const isOnlyPeerCoach = isPeerCoach && roles.length === 1; 
  const hasAdminRights = roles.some((r: any) => ["admin", "advisor", "counsellor", "coach_admin"].includes(r.name));

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await apiRequest<{ data: Group[] }>("/groups", {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      return res.data?.filter(g => g.type !== 'club') || [];
    },
    enabled: !!session?.accessToken && !preselectGroup && !(isPeerCoach && !hasAdminRights),
    staleTime: 1000 * 60 * 5,
  });

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['campus_locations'],
    queryFn: async () => {
      const res = await apiRequest<{ locations: Location[] }>("/locations", {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      return res.locations || [];
    },
    enabled: !!session?.accessToken,
  });

  useEffect(() => {
    if (session?.accessToken) {
      if (preselectGroup) {
        setIsTargeted(true);
        setTargetGroupIds([preselectGroup]);
      } else if (isPeerCoach && !hasAdminRights) {
        setIsTargeted(true);
        setTargetGroupIds(["assigned_students"]);
      }
    }
  }, [session?.accessToken, preselectGroup, isPeerCoach, hasAdminRights]);

  const toggleGroup = (groupId: string) => {
    setTargetGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const submitMutation = useMutation({
    mutationFn: async (payloadData: { endpoint: string; payload: any }) => {
      const { endpoint, payload } = payloadData;
      return apiRequest(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create post.");
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const isFormValid = useMemo(() => {
    if (!title.trim()) return false;
    if (isTargeted && targetGroupIds.length === 0) return false;
    
    if (isEvent) {
      if (isOnline) {
        if (!meetingLink.trim()) return false;
      } else {
        if (!selectedLocation.trim()) return false;
      }
    } else {
      if (!content.trim()) return false;
    }
    return true;
  }, [title, content, isTargeted, targetGroupIds, isEvent, isOnline, meetingLink, selectedLocation]);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title.");
      return;
    }

    if (isTargeted && targetGroupIds.length === 0) {
      Alert.alert("Target Required", "Please select at least one target group.");
      return;
    }

    setIsSubmitting(true);
    
    const endpoint = isEvent ? "/events" : "/posts";
    const payload: any = {
      title: title.trim(),
      content: content.trim(),
      category: isEvent ? "event" : category.toLowerCase(),
      visibility: isTargeted ? "targeted" : "public",
      targetGroupIds: isTargeted ? targetGroupIds : [],
    };

    if (isEvent) {
      payload.eventDate = startDate.toISOString().split('T')[0];
      payload.eventTime = startDate.toTimeString().split(' ')[0].substring(0, 5);
      payload.endDate = endDate.toISOString().split('T')[0];
      payload.endTime = endDate.toTimeString().split(' ')[0].substring(0, 5);
      payload.isAllDay = isAllDay;
      payload.isOnline = isOnline;
      
      if (isOnline) {
        payload.meetingLink = meetingLink.trim();
      } else {
        payload.location = selectedLocation.trim();
      }
      
      if (reminder) {
        payload.reminderMinutes = reminder;
      }
      payload.capacity = capacity ? parseInt(capacity, 10) : null;
      payload.rsvpEnabled = rsvpEnabled;
    }

    submitMutation.mutate({ endpoint, payload });
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <IconSymbol name="xmark" size={24} color="#374151" />
          </Pressable>
          <Pressable 
            style={[styles.saveBtn, (!isFormValid || isSubmitting) && { opacity: 0.5 }]} 
            onPress={handleSubmit} 
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{isEvent ? "Create Event" : "Post Update"}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabSegment} contentContainerStyle={{ padding: 4 }}>
            {categories.map(c => (
              <Pressable 
                key={c}
                style={[styles.tab, category === c && styles.tabActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.tabText, category === c && styles.tabTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
          />
          
          <View style={styles.divider} />

          {/* Visibility Controls */}
          {preselectGroup ? (
            <View style={styles.fixedTargetContainer}>
              <IconSymbol name="person.2.fill" size={20} color="#4F46E5" />
              <Text style={styles.fixedTargetText}>
                Posting to club members
              </Text>
            </View>
          ) : (isPeerCoach && !hasAdminRights) ? (
            <View style={styles.fixedTargetContainer}>
              <IconSymbol name="person.2.fill" size={20} color="#4F46E5" />
              <Text style={styles.fixedTargetText}>
                Posting to assigned students
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.rowIcon}><IconSymbol name="eye" size={20} color="#6B7280" /></View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Targeted Post</Text>
                  <Switch
                    value={isTargeted}
                    onValueChange={setIsTargeted}
                    trackColor={{ false: "#E5E7EB", true: "#A93C40" }}
                  />
                </View>
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
                        No target groups available.
                      </Text>
                    )}
                  </View>
                </View>
              )}
              <View style={styles.divider} />
            </>
          )}

          {isEvent && (
            <>
              <View style={styles.row}>
                <View style={styles.rowIcon}><IconSymbol name="clock" size={20} color="#6B7280" /></View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>All day</Text>
                  <Switch 
                    value={isAllDay} 
                    onValueChange={setIsAllDay} 
                    trackColor={{ true: '#A93C40', false: '#D1D5DB' }}
                  />
                </View>
              </View>

              {/* Start Date/Time */}
              <View style={styles.row}>
                <View style={styles.rowIcon} />
                <View style={styles.dateTimeContainer}>
                  <Pressable style={styles.dateChip} onPress={() => setShowPicker('start_date')}>
                    <Text style={styles.dateChipText}>{formatDate(startDate)}</Text>
                  </Pressable>
                  {!isAllDay && (
                    <Pressable style={styles.dateChip} onPress={() => setShowPicker('start_time')}>
                      <Text style={styles.dateChipText}>{formatTime(startDate)}</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* End Date/Time */}
              <View style={styles.row}>
                <View style={styles.rowIcon} />
                <View style={styles.dateTimeContainer}>
                  <Pressable style={styles.dateChip} onPress={() => setShowPicker('end_date')}>
                    <Text style={styles.dateChipText}>{formatDate(endDate)}</Text>
                  </Pressable>
                  {!isAllDay && (
                    <Pressable style={styles.dateChip} onPress={() => setShowPicker('end_time')}>
                      <Text style={styles.dateChipText}>{formatTime(endDate)}</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Online Toggle */}
              <View style={styles.row}>
                <View style={styles.rowIcon}><IconSymbol name="globe" size={20} color="#6B7280" /></View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Online Event</Text>
                  <Switch 
                    value={isOnline} 
                    onValueChange={setIsOnline} 
                    trackColor={{ true: '#A93C40', false: '#D1D5DB' }}
                  />
                </View>
              </View>

              {/* Location or Link */}
              {isOnline ? (
                <View style={styles.row}>
                  <View style={styles.rowIcon}><IconSymbol name="link" size={20} color="#6B7280" /></View>
                  <TextInput
                    style={[styles.rowLabel, { flex: 1, paddingVertical: 12 }]}
                    placeholder="Paste meeting link..."
                    placeholderTextColor="#9CA3AF"
                    value={meetingLink}
                    onChangeText={setMeetingLink}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              ) : (
                <>
                  <Pressable style={styles.row} onPress={() => setShowLocDropdown(!showLocDropdown)}>
                    <View style={styles.rowIcon}><IconSymbol name="mappin.and.ellipse" size={20} color="#6B7280" /></View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowLabel, !selectedLocation && { color: '#9CA3AF' }]}>
                        {selectedLocation || 'Location'}
                      </Text>
                      <IconSymbol name={showLocDropdown ? "chevron.up" : "chevron.down"} size={20} color="#6B7280" />
                    </View>
                  </Pressable>
                  {showLocDropdown && (
                    <View style={styles.dropdownContainer}>
                      <TextInput
                        style={styles.locSearchInput}
                        placeholder="Search locations..."
                        placeholderTextColor="#9CA3AF"
                        value={locationSearchQuery}
                        onChangeText={setLocationSearchQuery}
                        autoCapitalize="none"
                      />
                      {isLoadingLocations ? (
                        <ActivityIndicator style={{ padding: 16 }} />
                      ) : (
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                          {locations
                            .filter(loc => loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                            .map(loc => (
                              <Pressable 
                                key={loc.id} 
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setSelectedLocation(loc.name);
                                  setShowLocDropdown(false);
                                  setLocationSearchQuery("");
                                }}
                              >
                                <Text style={styles.dropdownItemText}>{loc.name}</Text>
                              </Pressable>
                            ))}
                          {locations.filter(loc => loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase())).length === 0 && (
                            <Text style={styles.noLocResults}>No locations found.</Text>
                          )}
                        </ScrollView>
                      )}
                      <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
                      <TextInput
                        style={styles.customLocInput}
                        placeholder="Or type custom location..."
                        value={selectedLocation}
                        onChangeText={setSelectedLocation}
                      />
                    </View>
                  )}
                </>
              )}

              {/* Reminder */}
              <Pressable 
                style={styles.row}
                onPress={() => setReminder(reminder === null ? 15 : null)}
              >
                <View style={styles.rowIcon}><IconSymbol name="bell" size={20} color="#6B7280" /></View>
                <Text style={styles.rowLabel}>{reminder ? `${reminder} mins before` : 'No reminder'}</Text>
              </Pressable>
              
              <View style={styles.divider} />
            </>
          )}

          {/* Notes / Description */}
          <View style={styles.row}>
            <View style={styles.rowIcon}><IconSymbol name="text.alignleft" size={20} color="#6B7280" /></View>
            <TextInput
              style={[styles.rowLabel, { flex: 1, minHeight: 100, textAlignVertical: 'top' }]}
              placeholder={isEvent ? "Notes or Description" : "What's happening on campus?"}
              placeholderTextColor="#9CA3AF"
              multiline
              value={content}
              onChangeText={setContent}
            />
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        {showPicker && (
          <DateTimePicker
            value={
              showPicker.includes('start') ? startDate : endDate
            }
            mode={showPicker.includes('time') ? 'time' : 'date'}
            display="spinner"
            onChange={(event, date) => {
              setShowPicker(null);
              if (date) {
                if (showPicker === 'start_date') {
                  const newDate = new Date(startDate);
                  newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setStartDate(newDate);
                } else if (showPicker === 'start_time') {
                  const newDate = new Date(startDate);
                  newDate.setHours(date.getHours(), date.getMinutes());
                  setStartDate(newDate);
                } else if (showPicker === 'end_date') {
                  const newDate = new Date(endDate);
                  newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setEndDate(newDate);
                } else if (showPicker === 'end_time') {
                  const newDate = new Date(endDate);
                  newDate.setHours(date.getHours(), date.getMinutes());
                  setEndDate(newDate);
                }
              }
            }}
          />
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    padding: 8,
  },
  saveBtn: {
    backgroundColor: '#A93C40',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  tabContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  tabSegment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    marginHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#111827',
  },
  scrollContent: {
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '400',
    color: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  rowLabel: {
    fontSize: 16,
    color: '#111827',
  },
  dateTimeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  dateChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateChipText: {
    fontSize: 15,
    color: '#111827',
  },
  dropdownContainer: {
    marginLeft: 56,
    marginRight: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
  locSearchInput: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noLocResults: {
    padding: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  customLocInput: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
  },
  groupsContainer: {
    marginLeft: 56,
    marginRight: 16,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
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
  fixedTargetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  fixedTargetText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    flex: 1,
  },
});
