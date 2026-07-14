import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Linking,
  TextInput,
  Keyboard,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOCK_OFFICES } from "@/lib/mock-data";

const { width } = Dimensions.get("window");

const ASHESI_REGION = {
  latitude: 5.7597,
  longitude: -0.2197,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

// Map Categories Spec
const CATEGORIES = [
  { id: "academic", name: "Academic", icon: "building.2.fill", color: "#3B82F6", essential: true },
  { id: "dining", name: "Dining", icon: "fork.knife", color: "#EC4899", essential: true },
  { id: "health", name: "Health Center", icon: "cross.case.fill", color: "#EF4444", essential: true },
  { id: "hostel", name: "Hostels", icon: "bed.double.fill", color: "#F59E0B", essential: false },
  { id: "lab", name: "Labs", icon: "hammer.fill", color: "#10B981", essential: false },
  { id: "sports", name: "Sports", icon: "figure.2.arms.open", color: "#6366F1", essential: false },
  { id: "cafeteria", name: "Cafeterias", icon: "fork.knife", color: "#F472B6", essential: false },
  { id: "shop", name: "Shops", icon: "briefcase.fill", color: "#8B5CF6", essential: false },
  { id: "office", name: "Offices", icon: "briefcase.fill", color: "#14B8A6", essential: false },
];

const DIRECTORY = [
  // Buildings (Outdoor coordinates)
  {
    id: "b1",
    name: "Norton Motulsky Hall",
    shortName: "Norton",
    category: "academic",
    coordinate: { latitude: 5.7600, longitude: -0.2195 },
    icon: "building.2.fill",
    emoji: "🏢",
    description: "Main academic building housing classrooms, faculty offices, and lecture halls.",
    hours: "Mon - Sat, 7:00 AM - 10:00 PM",
  },
  {
    id: "b2",
    name: "Radichel Hall",
    shortName: "Radichel",
    category: "academic",
    coordinate: { latitude: 5.7595, longitude: -0.2199 },
    icon: "building.2.fill",
    emoji: "🏢",
    description: "Multi-purpose building featuring student lounges, administrative offices, and cafeterias.",
    hours: "Mon - Sun, 6:00 AM - 11:00 PM",
  },
  {
    id: "b3",
    name: "Warren Library",
    shortName: "Library",
    category: "academic",
    coordinate: { latitude: 5.7598, longitude: -0.2202 },
    icon: "book.fill",
    emoji: "📚",
    description: "The main campus library equipped with learning spaces, research resources, and the IT helpdesk.",
    hours: "Mon - Fri, 8:00 AM - 12:00 AM • Sat - Sun, 10:00 AM - 10:00 PM",
  },
  {
    id: "b4",
    name: "King Engineering Building",
    shortName: "King Eng",
    category: "academic",
    coordinate: { latitude: 5.7602, longitude: -0.2192 },
    icon: "building.2.fill",
    emoji: "💻",
    description: "Engineering hub with state-of-the-art labs, design workspaces, and maker spaces.",
    hours: "Mon - Sat, 7:00 AM - 10:00 PM",
  },
  {
    id: "b5",
    name: "Wangari Maathai Hall",
    shortName: "Wangari",
    category: "hostel",
    coordinate: { latitude: 5.7590, longitude: -0.2190 },
    icon: "bed.double.fill",
    emoji: "🛏️",
    description: "Student residential facility named in honor of environmentalist Wangari Maathai.",
    hours: "24/7",
  },
  {
    id: "b6",
    name: "Akayet Hostel",
    shortName: "Akayet",
    category: "hostel",
    coordinate: { latitude: 5.7585, longitude: -0.2185 },
    icon: "bed.double.fill",
    emoji: "🛏️",
    description: "On-campus student residential housing block.",
    hours: "24/7",
  },
  {
    id: "b7",
    name: "Natembea Health Center",
    shortName: "Health Ctr",
    category: "health",
    coordinate: { latitude: 5.7610, longitude: -0.2205 },
    icon: "cross.case.fill",
    emoji: "🏥",
    description: "Natembea Health Clinic providing medical services, counseling, and 24/7 emergency support.",
    hours: "24/7 for Emergencies • Clinic: 8:00 AM - 6:00 PM",
    linked_office_id: "health",
  },
  {
    id: "b8",
    name: "Ashesi Sports Pitch",
    shortName: "Pitch",
    category: "sports",
    coordinate: { latitude: 5.7615, longitude: -0.2180 },
    icon: "figure.2.arms.open",
    emoji: "⚽",
    description: "Football field and athletic track for recreation, sports events, and physical education.",
    hours: "Daily, 6:00 AM - 7:00 PM",
  },
  {
    id: "b9",
    name: "Campus Gymnasium",
    shortName: "Gym",
    category: "sports",
    coordinate: { latitude: 5.7608, longitude: -0.2178 },
    icon: "figure.2.arms.open",
    emoji: "🏋️",
    description: "Equipped fitness center and gym for workouts, weight training, and cardio.",
    hours: "Mon - Sat, 5:30 AM - 9:30 PM",
  },
  {
    id: "b10",
    name: "Hive Dining Hall",
    shortName: "Hive",
    category: "dining",
    coordinate: { latitude: 5.7593, longitude: -0.2201 },
    icon: "fork.knife",
    emoji: "🍽️",
    description: "The primary dining facility offering breakfast, lunch, dinner, and snack options.",
    hours: "Daily, 7:00 AM - 9:00 PM",
  },
  
  // Indoor Locations (Classrooms, Offices, Labs - resolve coordinate from parentId)
  {
    id: "c1",
    name: "Room 214",
    category: "academic",
    parentId: "b1",
    building: "Norton Motulsky Hall",
    floor: "2nd Floor",
    icon: "graduationcap.fill",
    description: "Large lecture hall equipped with audiovisual systems, used for classes and seminars.",
  },
  {
    id: "c2",
    name: "Room 218",
    category: "academic",
    parentId: "b1",
    building: "Norton Motulsky Hall",
    floor: "2nd Floor",
    icon: "graduationcap.fill",
    description: "Standard classroom hosting lectures and tutorials.",
  },
  {
    id: "c3",
    name: "Design Lab",
    category: "lab",
    parentId: "b4",
    building: "King Engineering Building",
    floor: "Ground Floor",
    icon: "hammer.fill",
    description: "Engineering design laboratory for rapid prototyping and mechanical testing.",
  },
  {
    id: "o1",
    name: "ODIP Office",
    category: "office",
    parentId: "b2",
    building: "Radichel Hall",
    floor: "2nd Floor",
    icon: "earth.americas.fill",
    description: "Office of Diversity and International Programs. Assisting with visas, buddy up programs, and cultural exchange.",
    linked_office_id: "odip",
  },
  {
    id: "o2",
    name: "Career Services Center",
    category: "office",
    parentId: "b1",
    building: "Norton Motulsky Hall",
    floor: "Ground Floor",
    icon: "briefcase.fill",
    description: "Career advice, CV reviews, internships, and recruiter network placements.",
    linked_office_id: "career",
  },
  {
    id: "o3",
    name: "IT Support Desk",
    category: "office",
    parentId: "b3",
    building: "Warren Library",
    floor: "Ground Floor",
    icon: "heart.text.square.fill",
    description: "Technical assistance for student laptops, printing accounts, and Wi-Fi networks.",
    linked_office_id: "it",
  },
];

type LocationItem = typeof DIRECTORY[0];

export default function MapScreen() {
  const [activeCategories, setActiveCategories] = useState<string[]>(
    CATEGORIES.filter((c) => c.essential).map((c) => c.id)
  );
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Location States
  const [userCoords, setUserCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  // Floating label positions (screen x,y for each building)
  const [labelPositions, setLabelPositions] = useState<Record<string, { x: number; y: number }>>({}); 

  // Filter building markers based on active categories (including parent buildings containing active subcategories)
  const activeBuildings = DIRECTORY.filter((building) => {
    if (!building.coordinate) return false;

    // Direct category match
    if (activeCategories.includes(building.category)) return true;

    // Indirect matching: Does the building house any rooms/offices in active categories?
    const hasActiveIndoorLocation = DIRECTORY.some(
      (item) => item.parentId === building.id && activeCategories.includes(item.category)
    );

    return hasActiveIndoorLocation;
  });

  const updateLabelPositions = useCallback(async () => {
    if (!mapRef.current) return;
    const positions: Record<string, { x: number; y: number }> = {};
    try {
      const results = await Promise.all(
        activeBuildings.map(async (b) => {
          if (!b.coordinate) return null;
          try {
            const pt = await (mapRef.current as any).pointForCoordinate(b.coordinate);
            return { id: b.id, pt };
          } catch { return null; }
        })
      );
      results.forEach((r) => { if (r) positions[r.id] = r.pt; });
    } catch {}
    setLabelPositions(positions);
  }, [activeBuildings]);

  // Safe Location Permission Handling
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserCoords(loc.coords);
        } else {
          setErrorMsg("Permission to access location was denied");
        }
      } catch (e) {
        console.warn("Failed to get device location:", e);
      }
    })();
  }, []);

  const getCoordinate = (item: LocationItem) => {
    if (item.coordinate) return item.coordinate;
    const parent = DIRECTORY.find((d) => d.id === item.parentId);
    return parent?.coordinate;
  };

  const toggleCategory = (catId: string) => {
    setActiveCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return DIRECTORY.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.building && item.building.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // "Nearest to Me" Shortcut
  const findNearest = (category: string) => {
    // Determine the reference position (user GPS if available, otherwise campus center)
    const refLat = userCoords?.latitude ?? ASHESI_REGION.latitude;
    const refLng = userCoords?.longitude ?? ASHESI_REGION.longitude;

    const matches = DIRECTORY.filter((item) => item.category === category);
    if (matches.length === 0) return;

    let nearestItem: LocationItem | null = null;
    let minDistance = Infinity;

    matches.forEach((item) => {
      const coord = getCoordinate(item);
      if (coord) {
        const dist = getDistance(refLat, refLng, coord.latitude, coord.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestItem = item;
        }
      }
    });

    if (nearestItem) {
      focusItem(nearestItem);
    }
  };

  const focusItem = (item: LocationItem) => {
    setSelectedItem(item);
    setSearchQuery("");
    setIsSearching(false);
    Keyboard.dismiss();

    const coord = getCoordinate(item);
    if (coord) {
      mapRef.current?.animateToRegion(
        {
          ...coord,
          latitudeDelta: 0.0012,
          longitudeDelta: 0.0012,
        },
        600
      );

      // Make sure the category layer is turned on so the pin is visible
      if (!activeCategories.includes(item.category)) {
        setActiveCategories((prev) => [...prev, item.category]);
      }
    }
  };

  const resetMap = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setIsSearching(false);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion(ASHESI_REGION, 500);
  };

  const handleGetDirections = () => {
    if (!selectedItem) return;
    const coord = getCoordinate(selectedItem);
    if (!coord) return;

    const url = Platform.select({
      ios: `maps://app?daddr=${coord.latitude},${coord.longitude}`,
      android: `google.navigation:q=${coord.latitude},${coord.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${coord.latitude},${coord.longitude}`,
    });
    Linking.openURL(url);
  };


  // Office details resolver
  const getOfficeDetails = (linkedOfficeId?: string) => {
    if (!linkedOfficeId || !MOCK_OFFICES[linkedOfficeId]) return null;
    return MOCK_OFFICES[linkedOfficeId];
  };

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={ASHESI_REGION}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        mapType="satellite"
        showsUserLocation={!!userCoords}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsCompass={true}
        zoomControlEnabled={true}
        onPress={() => {
          setIsSearching(false);
          Keyboard.dismiss();
          setSelectedItem(null);
        }}
        onMapReady={updateLabelPositions}
        onRegionChangeComplete={updateLabelPositions}
      >
        {activeBuildings.map((building) => {
          const categoryColor =
            CATEGORIES.find((c) => c.id === building.category)?.color ?? "#A93C40";
          return (
            <Marker
              key={building.id}
              coordinate={building.coordinate!}
              pinColor={categoryColor}
              onPress={() => focusItem(building)}
            />
          );
        })}
      </MapView>

      {/* Floating place-name labels overlay */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {activeBuildings.map((building) => {
          const pos = labelPositions[building.id];
          if (!pos) return null;
          const isActive =
            selectedItem?.id === building.id || selectedItem?.parentId === building.id;
          const categoryColor =
            CATEGORIES.find((c) => c.id === building.category)?.color ?? "#A93C40";
          return (
            <Pressable
              key={`label-${building.id}`}
              onPress={() => focusItem(building)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y - 42,
                transform: [{ translateX: -60 }],
                width: 120,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isActive ? categoryColor : "#FFFFFF",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: isActive ? "#FFFFFF" : categoryColor,
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                }}
              >
                <Text style={{ fontSize: 14 }}>{building.emoji}</Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: isActive ? "#FFFFFF" : "#1A2B4A",
                    marginLeft: 4,
                    flexShrink: 1,
                  }}
                >
                  {building.shortName || building.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Top Overlay Interface */}
      <View style={[styles.topOverlay, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Find classrooms, hostels, dining..."
            placeholderTextColor="#9BA3AE"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#9BA3AE" />
            </Pressable>
          )}
        </View>

        {/* Search Results Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <ScrollView
            style={styles.searchResults}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {searchResults.map((result) => (
              <Pressable
                key={result.id}
                style={styles.resultItem}
                onPress={() => focusItem(result)}
              >
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName}>{result.name}</Text>
                  <Text style={styles.resultSubtitle}>
                    {result.category.toUpperCase()}{" "}
                    {result.building ? `• Inside ${result.building}` : ""}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Category Horizontal Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategories.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => toggleCategory(cat.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? cat.color : "#FFFFFF",
                    borderColor: isActive ? cat.color : "#E5E7EB",
                  },
                ]}
              >
                <IconSymbol
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? "#FFFFFF" : "#4B5563"}
                />
                <Text style={[styles.categoryText, { color: isActive ? "#FFFFFF" : "#4B5563" }]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Floating Action Controls */}
      <View style={[styles.floatingControls, { top: Math.max(insets.top, 16) + 130 }]}>
        <Pressable style={styles.controlBtn} onPress={resetMap}>
          <IconSymbol name="location.fill" size={20} color="#1A2B4A" />
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={() => findNearest("health")}>
          <Text style={styles.quickActionText}>🏥</Text>
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={() => findNearest("dining")}>
          <Text style={styles.quickActionText}>🍽️</Text>
        </Pressable>
      </View>

      {/* Pin Detail bottom sheet */}
      {selectedItem && !isSearching && (
        <View
          style={[styles.detailSheetWrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View style={styles.detailSheet}>
            {/* Heading Section */}
            <View style={styles.detailHeader}>
              <View style={styles.titleWrapper}>
                <Text style={styles.detailTitle}>{selectedItem.name}</Text>
                <Text style={styles.detailSubtitle}>
                  {selectedItem.category.toUpperCase()}{" "}
                  {selectedItem.building && `• ${selectedItem.building}`}
                </Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                <IconSymbol name="xmark" size={16} color="#1A2B4A" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.detailScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Floor/Building Context */}
              {selectedItem.floor && (
                <View style={styles.contextBadge}>
                  <IconSymbol name="building.2.fill" size={14} color="#A93C40" />
                  <Text style={styles.contextText}>
                    {selectedItem.floor} inside {selectedItem.building}
                  </Text>
                </View>
              )}

              {/* Description */}
              <Text style={styles.detailDescription}>
                {selectedItem.description || "No description provided."}
              </Text>

              {/* Operating hours */}
              {selectedItem.hours && (
                <View style={styles.infoRow}>
                  <IconSymbol name="calendar" size={16} color="#4B5563" />
                  <Text style={styles.infoText}>{selectedItem.hours}</Text>
                </View>
              )}

              {/* Office integration details (pulled directly from Help Center records) */}
              {selectedItem.linked_office_id && getOfficeDetails(selectedItem.linked_office_id) && (
                <View style={styles.officeBlock}>
                  <View style={styles.officeBlockHeader}>
                    <Text style={styles.officeBlockTitle}>Help Center Office Support</Text>
                  </View>
                  {getOfficeDetails(selectedItem.linked_office_id)?.contacts?.email && (
                    <Text style={styles.officeInfoLine}>
                      ✉️ {getOfficeDetails(selectedItem.linked_office_id)?.contacts?.email}
                    </Text>
                  )}
                  {getOfficeDetails(selectedItem.linked_office_id)?.contacts?.phone && (
                    <Text style={styles.officeInfoLine}>
                      📞 {getOfficeDetails(selectedItem.linked_office_id)?.contacts?.phone}
                    </Text>
                  )}
                  {getOfficeDetails(selectedItem.linked_office_id)?.staff && (
                    <View style={styles.staffList}>
                      <Text style={styles.staffHeader}>Key Staff:</Text>
                      {getOfficeDetails(selectedItem.linked_office_id)?.staff.map((member) => (
                        <Text key={member.id} style={styles.staffLine}>
                          • {member.name} ({member.role})
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Handoff directions button */}
            <Pressable style={styles.directionsBtn} onPress={handleGetDirections}>
              <IconSymbol
                name="arrow.triangle.turn.up.right.circle.fill"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.directionsText}>Get Directions</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#E5E7EB",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Custom Markers
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerIconBg: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },

  // Top overlay interface
  topOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 20,
    gap: 8,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#1A2B4A",
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  searchResults: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    maxHeight: 200,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2B4A",
  },
  resultSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // Horizontal Category Chips
  categoriesContainer: {
    flexDirection: "row",
  },
  categoriesContent: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Floating Actions Controls
  floatingControls: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    gap: 10,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 18,
  },

  // Detail Sheet Bottom
  detailSheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  detailSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    maxHeight: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A2B4A",
  },
  detailSubtitle: {
    fontSize: 12,
    color: "#9BA3AE",
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  detailScroll: {
    flex: 1,
  },
  contextBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    marginBottom: 8,
  },
  contextText: {
    fontSize: 12,
    color: "#A93C40",
    fontWeight: "600",
  },
  detailDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  officeBlock: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  officeBlockHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 4,
    marginBottom: 6,
  },
  officeBlockTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1A2B4A",
  },
  officeInfoLine: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 3,
  },
  staffList: {
    marginTop: 6,
  },
  staffHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1A2B4A",
    marginBottom: 2,
  },
  staffLine: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A2B4A",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  directionsText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
