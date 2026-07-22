import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiRequest } from "@/lib/api";

const { width, height } = Dimensions.get("window");

const ASHESI_REGION = {
  latitude: 5.7597,
  longitude: -0.2197,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

const customMapStyle = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }]
  }
];

type LocationItem = {
  id: string;
  name: string;
  shortName: string | null;
  category: string;
  building: string | null;
  description: string | null;
  icon: string | null;
  emoji: string | null;
  hours: string | null;
  latitude: number;
  longitude: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
};

const CATEGORY_COLORS: Record<string, string> = {
  Academic: "#3B82F6",
  Dining: "#F59E0B",
  Hostel: "#10B981",
  Services: "#8B5CF6",
  Recreation: "#EF4444",
};

export default function MapScreen() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [userCoords, setUserCoords] = useState<Location.LocationObjectCoords | null>(null);
  
  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const insets = useSafeAreaInsets();
  
  // Slide animation for bottom sheet
  const slideAnim = useRef(new Animated.Value(height)).current;

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesCategory = activeCategory === "All" || loc.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        loc.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [locations, activeCategory, searchQuery]);


  useEffect(() => {
    fetchLocations();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserCoords(loc.coords);
        }
      } catch (e) {
        console.warn("Failed to get location:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
      
      mapRef.current?.animateToRegion(
        {
          ...selectedItem.coordinate,
          latitudeDelta: 0.0012,
          longitudeDelta: 0.0012,
        },
        600
      );
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedItem]);

  useEffect(() => {
    if (locations.length === 0) return;
    
    if (activeCategory === "All" && searchQuery.trim() === "") {
      mapRef.current?.animateToRegion(ASHESI_REGION, 500);
    } else if (filteredLocations.length > 0) {
      const coords = filteredLocations.map(loc => loc.coordinate);
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 150, right: 50, bottom: 400, left: 50 },
          animated: true,
        });
      }, 100);
    }
  }, [filteredLocations, activeCategory, searchQuery, locations.length]);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ locations: LocationItem[] }>("/locations");
      setLocations(res.locations);
    } catch (e) {
      console.error("Failed to fetch locations", e);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(locations.map(l => l.category));
    return ["All", ...Array.from(cats)].filter(Boolean);
  }, [locations]);

  const handleGetDirections = () => {
    if (!selectedItem) return;
    const { latitude, longitude } = selectedItem.coordinate;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    Linking.openURL(url as string);
  };

  const resetMap = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setIsSearching(false);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion(ASHESI_REGION, 500);
  };

  const focusUserLocation = () => {
    if (userCoords) {
      mapRef.current?.animateToRegion(
        {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.0012,
          longitudeDelta: 0.0012,
        },
        500
      );
    }
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
        showsCompass={true}
        showsPointsOfInterest={false}
        customMapStyle={customMapStyle}
        zoomControlEnabled={true}
        onPress={() => {
          setIsSearching(false);
          Keyboard.dismiss();
          setSelectedItem(null);
        }}
      >
        {filteredLocations.map(loc => {
          const isSelected = selectedItem?.id === loc.id;
          const isFiltered = activeCategory !== "All";
          const isSearched = searchQuery.trim().length > 0;
          const showLabel = isSelected || isFiltered || isSearched;
          const color = CATEGORY_COLORS[loc.category] || "#A93C40";
          return (
            <Marker
              key={loc.id}
              coordinate={loc.coordinate}
              onPress={() => {
                setSelectedItem(loc);
                setIsSearching(false);
                Keyboard.dismiss();
              }}
              style={{ zIndex: isSelected ? 10 : 1 }}
            >
               <Callout tooltip>
                 <View style={{
                   backgroundColor: "#FFFFFF",
                   paddingHorizontal: 12,
                   paddingVertical: 8,
                   borderRadius: 12,
                   borderWidth: 1.5,
                   borderColor: color,
                   alignItems: "center",
                   justifyContent: "center",
                   elevation: 5,
                   shadowColor: "#000",
                   shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.3,
                   shadowRadius: 4,
                 }}>
                   <Text style={{ fontSize: 13, fontWeight: "700", color: "#1A2B4A" }}>
                     {loc.shortName || loc.name}
                   </Text>
                 </View>
               </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Map Action Buttons */}
      <View style={[styles.mapActions, { top: Math.max(insets.top, 16) + 120 }]}>
        <Pressable style={styles.actionBtn} onPress={resetMap}>
          <IconSymbol name="map.fill" size={20} color="#1A2B4A" />
        </Pressable>
        {userCoords && (
          <Pressable style={styles.actionBtn} onPress={focusUserLocation}>
            <IconSymbol name="location.fill" size={20} color="#1A2B4A" />
          </Pressable>
        )}
      </View>

      {/* Top Search & Filter Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#9BA3AE" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campus locations..."
            placeholderTextColor="#9BA3AE"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setIsSearching(true);
            }}
            onFocus={() => setIsSearching(true)}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#9BA3AE" />
            </Pressable>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(cat => (
            <Pressable
              key={cat}
              onPress={() => { setActiveCategory(cat); setSelectedItem(null); }}
              style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
            >
              <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#A93C40" />
        </View>
      )}

      {/* Search Results Dropdown */}
      {isSearching && searchQuery.length > 0 && (
        <View style={[styles.searchResults, { top: insets.top + 120 }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {filteredLocations.map(loc => (
              <Pressable
                key={loc.id}
                style={styles.searchResultItem}
                onPress={() => {
                  setSelectedItem(loc);
                  setIsSearching(false);
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.searchResultEmoji}>{loc.emoji || "📍"}</Text>
                <View>
                  <Text style={styles.searchResultName}>{loc.name}</Text>
                  <Text style={styles.searchResultCategory}>{loc.category}</Text>
                </View>
              </Pressable>
            ))}
            {filteredLocations.length === 0 && (
              <Text style={styles.noResultsText}>No locations found</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Bottom Sheet Details */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
        {selectedItem && (
          <View style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIconWrapper, { backgroundColor: CATEGORY_COLORS[selectedItem.category] || "#A93C40" }]}>
                <Text style={styles.sheetIconEmoji}>{selectedItem.emoji || "📍"}</Text>
              </View>
              <View style={styles.sheetTitleContainer}>
                <Text style={styles.sheetTitle}>{selectedItem.name}</Text>
                <Text style={styles.sheetCategory}>{selectedItem.category}</Text>
              </View>
              <Pressable onPress={() => setSelectedItem(null)} style={styles.closeSheetBtn}>
                <IconSymbol name="xmark" size={24} color="#9BA3AE" />
              </Pressable>
            </View>

            {selectedItem.description && (
              <Text style={styles.sheetDescription}>{selectedItem.description}</Text>
            )}

            {selectedItem.hours && (
              <View style={styles.infoRow}>
                <IconSymbol name="clock.fill" size={18} color="#6B7280" />
                <Text style={styles.infoText}>{selectedItem.hours}</Text>
              </View>
            )}

            <Pressable style={styles.directionsBtn} onPress={handleGetDirections}>
              <IconSymbol name="location.fill" size={20} color="#FFFFFF" />
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  map: { width, height },
  
  markerContainer: { alignItems: "center", justifyContent: "center" },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
    zIndex: 10,
  },
  markerEmoji: { fontSize: 18 },
  markerLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
  },
  markerLabelSelected: {
    backgroundColor: '#A93C40',
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A2B4A',
  },
  markerLabelTextSelected: {
    color: '#FFFFFF',
  },
  pulseRing: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#A93C40",
    opacity: 0.3,
    zIndex: -1,
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1A2B4A",
  },
  categoriesScroll: { flexGrow: 0 },
  categoriesContent: { gap: 8, paddingRight: 32 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillActive: { backgroundColor: "#A93C40" },
  categoryPillText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  categoryPillTextActive: { color: "#FFFFFF" },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  searchResults: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    maxHeight: 300,
    zIndex: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultEmoji: { fontSize: 24, marginRight: 12 },
  searchResultName: { fontSize: 16, fontWeight: "600", color: "#1A2B4A" },
  searchResultCategory: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  noResultsText: { padding: 20, textAlign: "center", color: "#6B7280" },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    marginBottom: 80,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 40,
  },
  sheetContent: { padding: 24 },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  sheetIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  sheetIconEmoji: { fontSize: 24 },
  sheetTitleContainer: { flex: 1 },
  sheetTitle: { fontSize: 22, fontWeight: "800", color: "#1A2B4A", marginBottom: 4 },
  sheetCategory: { fontSize: 14, fontWeight: "600", color: "#6B7280", textTransform: "uppercase" },
  closeSheetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDescription: { fontSize: 15, color: "#4B5563", lineHeight: 22, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  infoText: { fontSize: 15, color: "#4B5563", marginLeft: 12, fontWeight: "500" },
  directionsBtn: {
    backgroundColor: "#A93C40",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  directionsBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  mapActions: {
    position: "absolute",
    right: 16,
    gap: 12,
    zIndex: 10,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
