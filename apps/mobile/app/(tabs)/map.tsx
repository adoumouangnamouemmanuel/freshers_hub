import React, { useState, useRef, useMemo } from "react";
import { StyleSheet, Text, View, Pressable, Platform, Linking, TextInput, Keyboard, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { IconSymbol } from "@/components/ui/icon-symbol";

const ASHESI_REGION = {
  latitude: 5.7597,
  longitude: -0.2197,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

const DIRECTORY = [
  // Buildings
  { id: "b1", shortName: "Norton", name: "Norton Motulsky Hall", type: "Building", coordinate: { latitude: 5.7600, longitude: -0.2195 }, icon: "building.2.fill", emoji: "🏢", description: "Main administration and primary classrooms." },
  { id: "b2", shortName: "Radichel", name: "Radichel Hall", type: "Building", coordinate: { latitude: 5.7595, longitude: -0.2199 }, icon: "fork.knife", emoji: "🍽️", description: "Cafeteria, student lounges, and offices." },
  { id: "b3", shortName: "Library", name: "Warren Library", type: "Building", coordinate: { latitude: 5.7598, longitude: -0.2202 }, icon: "book.fill", emoji: "📚", description: "Campus library and IT support." },
  { id: "b4", shortName: "King Eng", name: "King Engineering", type: "Building", coordinate: { latitude: 5.7602, longitude: -0.2192 }, icon: "hammer.fill", emoji: "💻", description: "Engineering labs and maker spaces." },
  { id: "b5", shortName: "Wangari", name: "Wangari Maathai Hall", type: "Housing", coordinate: { latitude: 5.7590, longitude: -0.2190 }, icon: "bed.double.fill", emoji: "🛏️", description: "Student dormitories." },
  
  // Offices
  { id: "o1", name: "ODIP Office", type: "Office", parentId: "b2", icon: "earth.americas.fill", description: "Office of Diversity and International Programs. Ground Floor." },
  { id: "o2", name: "Career Services", type: "Office", parentId: "b1", icon: "briefcase.fill", description: "Career placement and internships. 2nd Floor." },
  { id: "o3", name: "IT Support Desk", type: "Office", parentId: "b3", icon: "laptopcomputer", description: "Tech support and laptop issues. Ground Floor." },
  { id: "o4", name: "Student Life", type: "Office", parentId: "b2", icon: "person.2.fill", description: "Support for clubs and student wellbeing." },

  // Classrooms
  { id: "c1", name: "Room 214", type: "Classroom", parentId: "b1", icon: "graduationcap.fill", description: "Lecture hall, 2nd Floor." },
  { id: "c2", name: "Room 218", type: "Classroom", parentId: "b1", icon: "graduationcap.fill", description: "Lecture hall, 2nd Floor." },
  { id: "c3", name: "Design Lab", type: "Lab", parentId: "b4", icon: "hammer.fill", description: "Prototyping and design tools. Ground Floor." },
];

export default function MapScreen() {
  const [selectedItem, setSelectedItem] = useState<typeof DIRECTORY[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const getCoordinate = (item: typeof DIRECTORY[0]) => {
    if (item.coordinate) return item.coordinate;
    const parent = DIRECTORY.find(d => d.id === item.parentId);
    return parent?.coordinate;
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

  const focusItem = (item: typeof DIRECTORY[0]) => {
    setSelectedItem(item);
    setSearchQuery("");
    setIsSearching(false);
    Keyboard.dismiss();

    const coord = getCoordinate(item);
    if (coord) {
      mapRef.current?.animateToRegion({
        ...coord,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      }, 500);
    }
  };

  const resetMap = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setIsSearching(false);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion(ASHESI_REGION, 500);
  };

  const onMapReady = () => {
    setMapReady(true);
    setTimeout(() => {
      mapRef.current?.animateToRegion(ASHESI_REGION, 500);
    }, 100);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return DIRECTORY.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.type.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const buildings = DIRECTORY.filter(d => d.coordinate);

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={ASHESI_REGION}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        mapType="satellite"
        showsUserLocation={false}
        showsPointsOfInterest={false}
        showsCompass={true}
        zoomControlEnabled={true}
        onMapReady={onMapReady}
        onPress={() => {
          setIsSearching(false);
          Keyboard.dismiss();
          setSelectedItem(null);
        }}
      >
        {buildings.map((building) => {
          const isActive = selectedItem?.id === building.id || selectedItem?.parentId === building.id;
          
          return (
            <Marker
              key={building.id}
              coordinate={building.coordinate!}
              onPress={() => focusItem(building)}
              style={{ zIndex: isActive ? 10 : 1 }}
              tracksViewChanges={false}
            >
              {/* EVERY nested view MUST have an explicit, hardcoded width and height. 
                  Otherwise, Android MapView will collapse them to 0x0 and they will appear as a tiny maroon dot. */}
              <View style={{ width: 100, height: 70, alignItems: "center", justifyContent: "flex-start", backgroundColor: "transparent" }}>
                
                <View style={{
                  width: isActive ? 46 : 38,
                  height: isActive ? 46 : 38,
                  backgroundColor: isActive ? "#A93C40" : "#FFFFFF",
                  borderRadius: isActive ? 23 : 19,
                  borderWidth: 2,
                  borderColor: isActive ? "#FFFFFF" : "#A93C40",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ 
                    fontSize: isActive ? 22 : 16, 
                    width: isActive ? 28 : 22, 
                    height: isActive ? 28 : 22, 
                    textAlign: "center" 
                  }}>
                    {building.emoji}
                  </Text>
                </View>

                <Text 
                  style={{
                    width: 90,
                    height: 18,
                    marginTop: 4,
                    backgroundColor: isActive ? "rgba(169, 60, 64, 0.9)" : "rgba(255, 255, 255, 0.9)",
                    color: isActive ? "#FFFFFF" : "#1A2B4A",
                    fontSize: 11,
                    fontWeight: "800",
                    textAlign: "center",
                    borderRadius: 4,
                    overflow: "hidden"
                  }}
                  numberOfLines={1}
                >
                  {building.shortName}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Search Bar */}
      <View style={[styles.topContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.searchWrapper}>
          <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for classrooms, offices..."
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

        {isSearching && searchResults.length > 0 && (
          <ScrollView style={styles.searchResults} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {searchResults.map(result => {
              const parent = DIRECTORY.find(d => d.id === result.parentId);
              return (
                <Pressable key={result.id} style={styles.resultItem} onPress={() => focusItem(result)}>
                  <View style={styles.resultIconBg}>
                    <IconSymbol name={result.icon as any} size={16} color="#A93C40" />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={styles.resultSubtitle}>
                      {result.type} {parent ? `• ${parent.name}` : ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Floating Reset / Recenter Button */}
      <View style={[
        styles.floatingControls, 
        { top: Math.max(insets.top, 16) + 64 }
      ]}>
        <Pressable style={styles.resetBtn} onPress={resetMap}>
          <IconSymbol name="location.fill" size={20} color="#1A2B4A" />
        </Pressable>
      </View>

      {/* Selected Location Detail Overlay */}
      {selectedItem && !isSearching && (
        <View style={[styles.detailSheetWrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleRow}>
                <View style={styles.detailIconBg}>
                  <IconSymbol name={selectedItem.icon as any} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.titleTextContainer}>
                  <Text style={styles.detailTitle} numberOfLines={1}>{selectedItem.name}</Text>
                  <Text style={styles.detailSubtitle}>
                    {selectedItem.type} 
                    {selectedItem.parentId && ` • Inside ${DIRECTORY.find(d => d.id === selectedItem.parentId)?.name}`}
                  </Text>
                </View>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                <IconSymbol name="xmark" size={20} color="#1A2B4A" /> 
              </Pressable>
            </View>

            <Text style={styles.detailDescription}>{selectedItem.description}</Text>
            
            <Pressable style={styles.directionsBtn} onPress={handleGetDirections}>
              <IconSymbol name="arrow.triangle.turn.up.right.circle.fill" size={18} color="#FFFFFF" />
              <Text style={styles.directionsText}>Open in Maps App</Text>
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
    backgroundColor: "#000",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top Search Interface
  topContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 20,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1A2B4A",
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  searchResults: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginTop: 8,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  resultIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#A93C4015",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4A",
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Floating Controls
  floatingControls: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    alignItems: "flex-end",
  },
  resetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  // Detail Sheet
  detailSheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  detailSheet: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#A93C40",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2B4A",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  detailSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A93C40",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  detailDescription: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 20,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A2B4A",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  directionsText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
