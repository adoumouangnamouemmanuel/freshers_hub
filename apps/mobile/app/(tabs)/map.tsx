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
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOCK_OFFICES, CATEGORIES, DIRECTORY } from "@/lib/mock-data";

const { width } = Dimensions.get("window");

const ASHESI_REGION = {
  latitude: 5.7597,
  longitude: -0.2197,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

type LocationItem = typeof DIRECTORY[0];

export default function MapScreen() {
  const [activeCategories, setActiveCategories] = useState<string[]>(
    CATEGORIES.filter((c) => c.essential).map((c) => c.id)
  );
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<LocationItem[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<LocationItem[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const { focusId } = useLocalSearchParams<{ focusId: string }>();
  
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

  useEffect(() => {
    // Load saved and recent places
    AsyncStorage.getItem("@map_saved").then(val => {
      if (val) setSavedPlaces(JSON.parse(val));
    });
    AsyncStorage.getItem("@map_recent").then(val => {
      if (val) setRecentPlaces(JSON.parse(val));
    });

    // Highlight user's assigned hostel (Simulated as b5 for Fresher)
    setTimeout(() => {
      const myHostel = DIRECTORY.find(d => d.id === "b5");
      if (myHostel) {
        focusItem(myHostel, false);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    if (focusId) {
      setTimeout(() => {
        const itemToFocus = DIRECTORY.find(d => d.id === focusId);
        if (itemToFocus) {
          focusItem(itemToFocus, true);
        }
      }, 500);
    }
  }, [focusId]);

  const toggleSavePlace = async (item: LocationItem) => {
    const isSaved = savedPlaces.some(p => p.id === item.id);
    let newSaved;
    if (isSaved) {
      newSaved = savedPlaces.filter(p => p.id !== item.id);
    } else {
      newSaved = [...savedPlaces, item];
    }
    setSavedPlaces(newSaved);
    await AsyncStorage.setItem("@map_saved", JSON.stringify(newSaved));
  };

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
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        (item.building && item.building?.toLowerCase().includes(query)) ||
        (item.description && item.description?.toLowerCase().includes(query))
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

  const focusItem = (item: LocationItem, addToRecent = true) => {
    setSelectedItem(item);
    setSearchQuery("");
    setIsSearching(false);
    Keyboard.dismiss();

    if (addToRecent) {
      setRecentPlaces(prev => {
        const filtered = prev.filter(p => p.id !== item.id);
        const next = [item, ...filtered].slice(0, 10);
        AsyncStorage.setItem("@map_recent", JSON.stringify(next));
        return next;
      });
    }

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
        {/* Search Bar Row */}
        <View style={styles.searchRow}>
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
          <Pressable 
            style={[styles.bookmarkBtn, showBookmarks && styles.bookmarkBtnActive]} 
            onPress={() => setShowBookmarks(!showBookmarks)}
          >
            <IconSymbol name="bookmark.fill" size={20} color={showBookmarks ? "#FFFFFF" : "#1A2B4A"} />
          </Pressable>
        </View>

        {/* Bookmarks & Recent Dropdown */}
        {showBookmarks && !isSearching && (
          <View style={styles.bookmarksSheet}>
            <Text style={styles.bookmarksTitle}>Saved Places</Text>
            {savedPlaces.length === 0 ? (
              <Text style={styles.emptyText}>No saved places yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {savedPlaces.map(p => (
                  <Pressable key={p.id} style={styles.recentItemCard} onPress={() => focusItem(p)}>
                    <Text style={styles.recentItemEmoji}>{p.emoji || "📍"}</Text>
                    <Text style={styles.recentItemName} numberOfLines={1}>{p.shortName || p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            
            <Text style={styles.bookmarksTitle}>Recently Viewed</Text>
            {recentPlaces.length === 0 ? (
              <Text style={styles.emptyText}>No recent activity.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentPlaces.map(p => (
                  <Pressable key={p.id} style={styles.recentItemCard} onPress={() => focusItem(p)}>
                    <Text style={styles.recentItemEmoji}>{p.emoji || "📍"}</Text>
                    <Text style={styles.recentItemName} numberOfLines={1}>{p.shortName || p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}

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
              <View style={styles.titleActionsRow}>
                <Pressable onPress={() => toggleSavePlace(selectedItem)} style={styles.saveBtn}>
                  <IconSymbol name={savedPlaces.some(p => p.id === selectedItem.id) ? "bookmark.fill" : "bookmark"} size={20} color="#A93C40" />
                </Pressable>
                <Pressable style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                  <IconSymbol name="xmark" size={16} color="#1A2B4A" />
                </Pressable>
              </View>
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
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
  bookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bookmarkBtnActive: {
    backgroundColor: "#A93C40",
  },
  bookmarksSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bookmarksTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#9BA3AE",
    fontStyle: "italic",
    marginBottom: 12,
  },
  recentItemCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: "center",
    width: 80,
  },
  recentItemEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  recentItemName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    textAlign: "center",
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
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  titleActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveBtn: {
    padding: 4,
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
