import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Image,
  Modal,
  Share,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import Mapbox from "@rnmapbox/maps";
import { IconSymbol } from "@/components/ui/icon-symbol";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { apiRequest } from "@/lib/api";
import { calculateCampusRoute } from "../../lib/routing";
import { campusNodes, Coordinate } from "../../constants/campusGraph";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

const { width, height } = Dimensions.get("window");

const ASHESI_REGION = {
  latitude: 5.7597,
  longitude: -0.2197,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

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
  isOpen?: boolean;
  floor_level: number;
  images?: string[];
  latitude: number;
  longitude: number;
  coordinate: Coordinate;
};

const CATEGORY_COLORS: Record<string, string> = {
  Academic: "#3B82F6",
  Dining: "#F59E0B",
  Hostel: "#10B981",
  Services: "#8B5CF6",
  Recreation: "#EF4444",
};

const getBounds = (coords: Coordinate[]) => {
  if (!coords || coords.length === 0) return null;
  let minLat = coords[0].latitude, maxLat = coords[0].latitude;
  let minLng = coords[0].longitude, maxLng = coords[0].longitude;
  coords.forEach(c => {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  });
  return { ne: [maxLng, maxLat], sw: [minLng, minLat] };
};

export default function MapScreen() {
  const { focusId } = useLocalSearchParams<{ focusId?: string }>();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [userCoords, setUserCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Coordinate[] | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Routing State
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeSource, setRouteSource] = useState<LocationItem | 'CURRENT_LOCATION'>('CURRENT_LOCATION');
  const [routeDestination, setRouteDestination] = useState<LocationItem | null>(null);
  const [selectingSource, setSelectingSource] = useState(false);

  // New States
  const [is3D, setIs3D] = useState(false);
  const [recentSearches, setRecentSearches] = useState<LocationItem[]>([]);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['campus_locations'],
    queryFn: async () => {
      const res = await apiRequest<{ locations: LocationItem[] }>("/locations");
      return res.locations || [];
    },
    staleTime: 1000 * 60 * 60 * 24 * 7,
  });
  
  const mapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "35%", "60%", "90%"], []);

  const handleSheetChanges = (index: number) => {
    if (index === -1) {
      setSelectedItem(null);
    }
  };

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesCategory = activeCategory === "All" || loc.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        loc.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [locations, activeCategory, searchQuery]);

  const geoJsonData = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: filteredLocations.map(loc => ({
        type: "Feature",
        id: loc.id,
        properties: {
          id: loc.id,
          name: loc.shortName || loc.name,
          iconKey: (loc.icon || "mappin") + "-" + loc.category,
          emoji: loc.emoji || "📍",
          category: loc.category,
          color: CATEGORY_COLORS[loc.category] || "#A93C40"
        },
        geometry: {
          type: "Point",
          coordinates: [loc.longitude, loc.latitude]
        }
      }))
    };
  }, [filteredLocations]);

  useEffect(() => {
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

    // Load recent searches
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('recentSearches');
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Failed to load recent searches", e);
      }
    })();
  }, []);

  const saveRecentSearch = async (loc: LocationItem) => {
    try {
      const updated = [loc, ...recentSearches.filter(item => item.id !== loc.id)].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save recent search", e);
    }
  };

  useEffect(() => {
    if (selectedItem && !isRoutingMode) {
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(2); // Middle snap point (60%)
      }, 100);
      
      cameraRef.current?.setCamera({
        centerCoordinate: [selectedItem.coordinate.longitude, selectedItem.coordinate.latitude],
        zoomLevel: 18,
        animationDuration: 600,
      });
    } else {
      bottomSheetRef.current?.close(); // Hide completely when nothing is selected
    }
  }, [selectedItem, isRoutingMode]);

  useEffect(() => {
    if (locations.length === 0 || isRoutingMode) return;
    
    if (activeCategory === "All" && searchQuery.trim() === "") {
      cameraRef.current?.setCamera({ centerCoordinate: [ASHESI_REGION.longitude, ASHESI_REGION.latitude], zoomLevel: 16, animationDuration: 500 });
    } else if (filteredLocations.length > 0) {
      const coords = filteredLocations.map(loc => loc.coordinate);
      const bounds = getBounds(coords);
      if (bounds) {
        cameraRef.current?.setCamera({ bounds: { ...bounds, paddingLeft: 50, paddingRight: 50, paddingTop: 150, paddingBottom: 400 }, animationDuration: 500 });
      }
    }
  }, [filteredLocations, activeCategory, searchQuery, locations.length, isRoutingMode]);

  useEffect(() => {
    if (focusId && locations.length > 0) {
      const targetLoc = locations.find(l => l.id === focusId);
      if (targetLoc) {
        setSelectedItem(targetLoc);
      }
    }
  }, [focusId, locations]);

  const categories = useMemo(() => {
    const cats = new Set(locations.map(l => l.category));
    return ["All", ...Array.from(cats)].filter(Boolean);
  }, [locations]);

  const uniqueIconSpecs = useMemo(() => {
    const specs = new Map<string, { icon: string, color: string }>();
    locations.forEach(l => {
      if (l.icon) {
        const key = `${l.icon}-${l.category}`;
        specs.set(key, { icon: l.icon, color: CATEGORY_COLORS[l.category] || "#A93C40" });
      }
    });
    return Array.from(specs.entries());
  }, [locations]);

  const decodePolyline = (t: string, e: number = 5) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        points.push({ latitude: (lat / Math.pow(10, e)), longitude: (lng / Math.pow(10, e)) });
    }
    return points;
  };

  const calculateAndDrawRoute = async (source: LocationItem | 'CURRENT_LOCATION', dest: LocationItem) => {
    const startCoord = source === 'CURRENT_LOCATION' 
      ? (userCoords ? { latitude: userCoords.latitude, longitude: userCoords.longitude } : campusNodes['h1'].coordinate)
      : source.coordinate;
      
    try {
      const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey || Constants.expoConfig?.ios?.config?.googleMapsApiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      const requestBody = {
        origin: { location: { latLng: { latitude: startCoord.latitude, longitude: startCoord.longitude } } },
        destination: { location: { latLng: { latitude: dest.coordinate.latitude, longitude: dest.coordinate.longitude } } },
        travelMode: 'WALK',
        polylineEncoding: 'ENCODED_POLYLINE'
      };
      
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline'
        },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0 && data.routes[0].polyline) {
        const points = decodePolyline(data.routes[0].polyline.encodedPolyline);
        setCurrentRoute(points);
        const bounds = getBounds(points);
        if (bounds) {
          cameraRef.current?.setCamera({ bounds: { ...bounds, paddingLeft: 50, paddingRight: 50, paddingTop: 200, paddingBottom: 50 }, animationDuration: 500 });
        }
      } else {
        console.log("No google route found, falling back to campus route");
        const route = calculateCampusRoute(startCoord, dest.coordinate);
        setCurrentRoute(route);
        const bounds = getBounds(route);
        if (bounds) {
          cameraRef.current?.setCamera({ bounds: { ...bounds, paddingLeft: 50, paddingRight: 50, paddingTop: 200, paddingBottom: 50 }, animationDuration: 500 });
        }
      }
    } catch (e) {
      console.error(e);
      const route = calculateCampusRoute(startCoord, dest.coordinate);
      setCurrentRoute(route);
      const bounds = getBounds(route);
      if (bounds) {
        cameraRef.current?.setCamera({ bounds: { ...bounds, paddingLeft: 50, paddingRight: 50, paddingTop: 200, paddingBottom: 50 }, animationDuration: 500 });
      }
    }
  };

  const handleGetDirections = () => {
    if (!selectedItem) return;
    
    setRouteDestination(selectedItem);
    setRouteSource('CURRENT_LOCATION');
    setIsRoutingMode(true);
    setSelectedItem(null); // hide sheet
    
    calculateAndDrawRoute('CURRENT_LOCATION', selectedItem);
  };

  const handleGetExternalDirections = () => {
    if (!selectedItem) return;
    const { latitude, longitude } = selectedItem.coordinate;
    const url = Platform.OS === 'ios'
      ? `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`
      : `google.navigation:q=${latitude},${longitude}`;
      
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
      }
    });
  };

  const exitRoutingMode = () => {
    setIsRoutingMode(false);
    setCurrentRoute(null);
    setRouteDestination(null);
    setSelectingSource(false);
    setIsSearching(false);
  };

  const resetMap = () => {
    setSelectedItem(null);
    setSearchQuery("");
    setIsSearching(false);
    exitRoutingMode();
    Keyboard.dismiss();
    cameraRef.current?.setCamera({ centerCoordinate: [ASHESI_REGION.longitude, ASHESI_REGION.latitude], zoomLevel: 16, animationDuration: 500 });
  };

  return (
    <View style={styles.screen}>
      <Mapbox.MapView
        ref={mapRef as any}
        style={styles.map}
        styleURL={Mapbox.StyleURL.SatelliteStreet}
        logoEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        onPress={() => {
          if (!selectingSource) {
            setIsSearching(false);
            Keyboard.dismiss();
            setSelectedItem(null);
          }
        }}
      >
        <Mapbox.SymbolLayer id="poi-label" existing={true} style={{ visibility: 'none' }} />
        
        {/* Custom Raster Source for better Satellite Imagery */}
        <Mapbox.RasterSource
          id="custom-satellite"
          // Google Maps Satellite (against TOS for production, but works for dev). Added &scale=2 for high-res retina screens:
          tileUrlTemplates={['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&scale=2']}
          tileSize={256}
        >
          <Mapbox.RasterLayer id="custom-satellite-layer" sourceID="custom-satellite" style={{ rasterOpacity: 1 }} />
        </Mapbox.RasterSource>
        
        <Mapbox.Images>
          {uniqueIconSpecs.map(([key, spec]) => (
            <Mapbox.Image key={key} name={key}>
              <View style={{ width: 16, height: 16, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name={spec.icon as any} size={16} color={spec.color} />
              </View>
            </Mapbox.Image>
          ))}
        </Mapbox.Images>

        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [ASHESI_REGION.longitude, ASHESI_REGION.latitude],
            zoomLevel: 16,
          }}
        />
        <Mapbox.UserLocation visible={!!userCoords} />

        {currentRoute && (
          <Mapbox.ShapeSource
            id="route-source"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: currentRoute.map(c => [c.longitude, c.latitude])
              },
              properties: {}
            }}
          >
            <Mapbox.LineLayer
              id="route-layer"
              style={{
                lineColor: '#3B82F6',
                lineWidth: 5,
                lineDasharray: [1, 1]
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {isRoutingMode && routeDestination && (
          <Mapbox.PointAnnotation
            id="dest-annotation"
            coordinate={[routeDestination.coordinate.longitude, routeDestination.coordinate.latitude]}
          >
             <View style={[styles.calloutContainer, { borderColor: CATEGORY_COLORS[routeDestination.category] || "#A93C40" }]}>
               <Text style={styles.calloutText}>{routeDestination.shortName || routeDestination.name} (Destination)</Text>
             </View>
          </Mapbox.PointAnnotation>
        )}
        
        {isRoutingMode && routeSource !== 'CURRENT_LOCATION' && (
          <Mapbox.PointAnnotation
            id="source-annotation"
            coordinate={[routeSource.coordinate.longitude, routeSource.coordinate.latitude]}
          >
             <View style={[styles.calloutContainer, { borderColor: "#10B981" }]}>
               <Text style={styles.calloutText}>{routeSource.shortName || routeSource.name} (Source)</Text>
             </View>
          </Mapbox.PointAnnotation>
        )}

        {!isRoutingMode && (
          <Mapbox.ShapeSource
            id="poi-source"
            shape={geoJsonData as any}
            onPress={(e: any) => {
              const feature = e.features[0];
              if (feature?.properties?.id) {
                const loc = filteredLocations.find(l => l.id === feature.properties.id);
                if (loc) {
                  setSelectedItem(loc);
                  setIsSearching(false);
                  Keyboard.dismiss();
                }
              }
            }}
          >
            <Mapbox.SymbolLayer
              id="poi-layer"
              style={{
                iconImage: ['get', 'iconKey'],
                iconSize: 1.2,
                iconAllowOverlap: false,
                textField: ['get', 'name'],
                textSize: 11,
                textColor: '#1A2B4A',
                textHaloColor: '#FFFFFF',
                textHaloWidth: 2,
                textOffset: [0, 0.8],
                textAnchor: 'top',
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>

      {/* Top Bar (Routing or Search) */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        {isRoutingMode ? (
          <View style={styles.routingContainer}>
            <View style={styles.routingHeaderRow}>
              <Pressable onPress={exitRoutingMode} style={{ padding: 8 }}>
                <IconSymbol name="chevron.left" size={24} color="#1A2B4A" />
              </Pressable>
              <View style={{flex: 1, marginLeft: 8}}>
                {/* Source Input */}
                <Pressable 
                  style={[styles.routingInput, selectingSource && styles.routingInputActive]}
                  onPress={() => { setSelectingSource(true); setIsSearching(true); setSearchQuery(""); }}
                >
                  <IconSymbol name="location.fill" size={16} color={routeSource === 'CURRENT_LOCATION' ? "#3B82F6" : "#10B981"} />
                  <Text style={[styles.routingInputText, { color: routeSource === 'CURRENT_LOCATION' ? "#3B82F6" : "#1A2B4A" }]}>
                    {routeSource === 'CURRENT_LOCATION' ? "Your Location" : routeSource.name}
                  </Text>
                </Pressable>
                
                {/* Destination Input (Readonly for now) */}
                <View style={[styles.routingInput, { marginTop: 8, backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                  <IconSymbol name="mappin.and.ellipse" size={16} color="#EF4444" />
                  <Text style={[styles.routingInputText, { fontWeight: 'bold' }]}>
                    {routeDestination?.name}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
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
        )}

        {!isRoutingMode && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
            {categories.map(cat => (
              <Pressable
                key={cat}
                onPress={() => { 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategory(cat); 
                  setSelectedItem(null); 
                }}
                style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#A93C40" />
        </View>
      )}

      {/* Search Results Dropdown (used for normal search OR selecting source) */}
      {isSearching && (searchQuery.length > 0 || recentSearches.length > 0 || selectingSource) && (
        <View style={[styles.searchResults, { top: Math.max(insets.top, 16) + (isRoutingMode ? 120 : 64) }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Option to use Current Location if selecting source */}
            {selectingSource && (
              <Pressable
                style={styles.searchResultItem}
                onPress={() => {
                  setRouteSource('CURRENT_LOCATION');
                  setSelectingSource(false);
                  setIsSearching(false);
                  Keyboard.dismiss();
                  if (routeDestination) calculateAndDrawRoute('CURRENT_LOCATION', routeDestination);
                }}
              >
                <IconSymbol name="location.fill" size={24} color="#3B82F6" />
                <View style={{marginLeft: 12}}>
                  <Text style={[styles.searchResultName, {color: '#3B82F6'}]}>Your Location</Text>
                  <Text style={styles.searchResultCategory}>Current GPS coordinates</Text>
                </View>
              </Pressable>
            )}

            {searchQuery.length === 0 && !selectingSource && recentSearches.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>Recent Searches</Text>
              </View>
            )}

            {(searchQuery.length > 0 ? filteredLocations : recentSearches).map(loc => (
              <Pressable
                key={loc.id}
                style={styles.searchResultItem}
                onPress={() => {
                  if (selectingSource && routeDestination) {
                    setRouteSource(loc);
                    setSelectingSource(false);
                    setIsSearching(false);
                    Keyboard.dismiss();
                    calculateAndDrawRoute(loc, routeDestination);
                  } else {
                    setSelectedItem(loc);
                    saveRecentSearch(loc);
                    setIsSearching(false);
                    Keyboard.dismiss();
                  }
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: CATEGORY_COLORS[loc.category] || "#A93C40", alignItems: 'center', justifyContent: 'center' }}>
                  <IconSymbol name={(loc.icon as any) || "mappin"} size={16} color="#FFFFFF" />
                </View>
                <View style={{marginLeft: 12}}>
                  <Text style={styles.searchResultName}>{loc.name}</Text>
                  <Text style={styles.searchResultCategory}>{loc.category}</Text>
                </View>
              </Pressable>
            ))}
            {searchQuery.length > 0 && filteredLocations.length === 0 && !selectingSource && (
              <Text style={styles.noResultsText}>No locations found</Text>
            )}
          </ScrollView>
        </View>
      )}

      
      {/* Floating Map Controls */}
      <View style={[styles.mapControls, { bottom: Math.max(insets.bottom, 120) }]}>
         <Pressable style={styles.fabBtn} onPress={() => {
             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
             if (is3D) {
               cameraRef.current?.setCamera({ pitch: 0, animationDuration: 500 });
               setIs3D(false);
             } else {
               cameraRef.current?.setCamera({ pitch: 45, animationDuration: 500 });
               setIs3D(true);
             }
         }}>
            <Text style={{ fontWeight: '800', fontSize: 16, color: '#1A2B4A' }}>{is3D ? '2D' : '3D'}</Text>
         </Pressable>
         <View style={styles.fabDivider} />
         <Pressable style={styles.fabBtn} onPress={() => {
             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
             cameraRef.current?.setCamera({ heading: 0, animationDuration: 500 });
         }}>
            <IconSymbol name="location.north.line.fill" size={20} color="#1A2B4A" />
         </Pressable>
         <View style={styles.fabDivider} />
         <Pressable style={styles.fabBtn} onPress={() => {
             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
             if (userCoords) {
               cameraRef.current?.setCamera({ centerCoordinate: [userCoords.longitude, userCoords.latitude], zoomLevel: 17, animationDuration: 500 });
             } else {
               resetMap();
             }
         }}>
            <IconSymbol name="location.fill" size={20} color="#3B82F6" />
         </Pressable>
      </View>

      {/* Bottom Sheet Details */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        style={styles.bottomSheetShadow}
      >
        
        {selectedItem ? (
          <BottomSheetScrollView style={styles.sheetContent} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}>
            
            {/* Image Gallery */}
            {selectedItem.images && selectedItem.images.length > 0 && (
              <View>
                <GHScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery} contentContainerStyle={{ paddingRight: 24, paddingLeft: 24 }} pagingEnabled snapToAlignment="center" decelerationRate="fast">
                  {selectedItem.images.map((imgUrl, idx) => (
                    <Pressable key={idx} onPress={() => setFullScreenImage(imgUrl)}>
                      <Image source={{ uri: imgUrl }} style={styles.locationImage} />
                    </Pressable>
                  ))}
                </GHScrollView>
                <View style={styles.paginationDots}>
                  {selectedItem.images.map((_, idx) => (
                    <View key={idx} style={styles.dot} />
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.sheetHeader, { paddingHorizontal: 24 }]}>
              <View style={[styles.sheetIconWrapper, { backgroundColor: CATEGORY_COLORS[selectedItem.category] || "#A93C40" }]}>
                <IconSymbol name={(selectedItem.icon as any) || "mappin"} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.sheetTitleContainer}>
                <Text style={styles.sheetTitle}>{selectedItem.name}</Text>
                <View style={styles.sheetMetaRow}>
                  <Text style={styles.sheetCategory}>{selectedItem.category}</Text>
                </View>
              </View>
              
              {/* Dynamic Open/Closed Badge */}
              {selectedItem.isOpen !== undefined && (
                <View style={[styles.statusBadge, { backgroundColor: selectedItem.isOpen ? '#DEF7EC' : '#FDE8E8' }]}>
                   <Text style={[styles.statusText, { color: selectedItem.isOpen ? '#03543F' : '#9B1C1C' }]}>
                     {selectedItem.isOpen ? 'Open' : 'Closed'}
                   </Text>
                </View>
              )}
            </View>

            {/* Action Buttons Row */}
            <View style={[styles.actionButtonsRow, { paddingHorizontal: 24 }]}>
              <Pressable style={styles.actionBtn} onPress={handleGetDirections}>
                <View style={styles.actionBtnIcon}>
                  <IconSymbol name="location.fill" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionBtnText}>Directions</Text>
              </Pressable>

              <Pressable style={styles.actionBtnSecondary} onPress={() => {
                Share.share({
                  message: `Check out ${selectedItem.name} at Ashesi University!`,
                });
              }}>
                <View style={styles.actionBtnIconSecondary}>
                  <IconSymbol name="square.and.arrow.up" size={20} color="#3B82F6" />
                </View>
              </Pressable>
              
              <Pressable style={styles.actionBtnSecondary} onPress={handleGetExternalDirections}>
                <View style={styles.actionBtnIconSecondary}>
                  <IconSymbol name="map.fill" size={20} color="#3B82F6" />
                </View>
              </Pressable>
            </View>

            <View style={styles.sheetDivider} />

            {selectedItem.description && (
              <View style={[styles.infoSection, { paddingHorizontal: 24 }]}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <Text style={styles.sheetDescription}>{selectedItem.description}</Text>
              </View>
            )}

            {selectedItem.hours && (
              <View style={[styles.infoRow, { paddingHorizontal: 24 }]}>
                <IconSymbol name="clock.fill" size={20} color="#3B82F6" />
                <Text style={styles.infoText}>{selectedItem.hours}</Text>
              </View>
            )}
          </BottomSheetScrollView>
        ) : null}

      </BottomSheet>

      {/* Full Screen Image Viewer */}
      <Modal visible={!!fullScreenImage} transparent={true} animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <Pressable style={{ position: 'absolute', top: Math.max(insets.top, 20), right: 20, zIndex: 10, padding: 8 }} onPress={() => setFullScreenImage(null)}>
            <IconSymbol name="xmark.circle.fill" size={32} color="#FFFFFF" />
          </Pressable>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={{ width: width, height: height * 0.8 }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  map: { width, height },
  calloutContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  calloutText: { fontSize: 13, fontWeight: "700", color: "#1A2B4A" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16, zIndex: 20 },
  
  routingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
    marginBottom: 12,
  },
  routingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routingInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  routingInputActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  routingInputText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#1A2B4A',
  },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.95)", marginHorizontal: 10, paddingHorizontal: 16, paddingVertical: 0, borderRadius: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: "#1A2B4A" },
  categoriesScroll: { marginTop: 12 },
  categoriesContent: { paddingHorizontal: 16, gap: 8 },
  categoryPill: { backgroundColor: "rgba(255, 255, 255, 0.9)", paddingHorizontal: 20, paddingVertical: 5, borderRadius: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  categoryPillActive: { backgroundColor: "#A93C40" },
  categoryPillText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  categoryPillTextActive: { color: "#FFFFFF" },
  loadingOverlay: { position: "absolute", top: 120, left: 0, right: 0, alignItems: "center" },
  
  searchResults: { position: "absolute", left: 32, right: 32, backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, maxHeight: 300, zIndex: 20, overflow: 'hidden' },
  searchResultItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  searchResultName: { fontSize: 16, fontWeight: "600", color: "#1A2B4A" },
  searchResultCategory: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  noResultsText: { padding: 20, textAlign: "center", color: "#6B7280" },
  
  bottomSheetBackground: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  bottomSheetIndicator: { backgroundColor: "#E5E7EB", width: 40, height: 5 },
  bottomSheetShadow: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20, zIndex: 40 },
  sheetContent: { paddingTop: 12 },
  imageGallery: { flexDirection: 'row', marginBottom: 8 },
  locationImage: { width: width - 48, height: 200, borderRadius: 16, marginRight: 16, backgroundColor: '#E5E7EB' },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  sheetIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 16 },
  sheetIconEmoji: { fontSize: 24 },
  sheetTitleContainer: { flex: 1, justifyContent: 'center' },
  sheetTitle: { fontSize: 22, fontWeight: "800", color: "#1A2B4A", marginBottom: 4 },
  sheetMetaRow: { flexDirection: 'row', alignItems: 'center' },
  sheetCategory: { fontSize: 14, fontWeight: "600", color: "#6B7280", textTransform: "uppercase" },
  sheetDot: { fontSize: 14, color: "#9BA3AE", marginHorizontal: 6 },
  sheetFloor: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  actionButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: "#3B82F6", borderRadius: 16, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionBtnIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 12 },
  actionBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  actionBtnSecondary: { flex: 1, backgroundColor: "#EFF6FF", borderRadius: 16, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  actionBtnIconSecondary: { backgroundColor: '#DBEAFE', padding: 6, borderRadius: 12 },
  actionBtnTextSecondary: { color: "#3B82F6", fontSize: 15, fontWeight: "700" },
  sheetDivider: { height: 1, backgroundColor: "#F3F4F6", width: "100%", marginVertical: 16 },
  infoSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4A", marginBottom: 8 },
  sheetDescription: { fontSize: 15, color: "#4B5563", lineHeight: 22 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoText: { fontSize: 15, color: "#4B5563", marginLeft: 12, fontWeight: "500" },
  rightSidebar: { position: "absolute", right: 16, zIndex: 10, width: 48 },
  controlGroup: { backgroundColor: "rgba(255, 255, 255, 0.75)", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5, overflow: "hidden" },
  sidebarBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: "rgba(0, 0, 0, 0.05)", width: "100%" },
  floorBtnActive: { backgroundColor: "#A93C40" },
  floorBtnText: { fontSize: 15, fontWeight: "700", color: "#6B7280" },
  floorBtnTextActive: { color: "#FFFFFF" },
  mapControls: { position: 'absolute', right: 16, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 30, overflow: 'hidden' },
  fabBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  fabDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 8 },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  exploreChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 100, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  exploreChipText: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
});
