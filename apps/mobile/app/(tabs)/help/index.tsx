import { useRouter } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  ImageBackground,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOCK_OFFICES } from "@/lib/mock-data";
import { apiRequest } from "@/lib/api";

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

const PRIMARY_COLOR = "#A93C40";
const TEXT_COLOR = "#1A2B4A";

function FeaturedCard({
  office,
  onPress,
}: {
  office: typeof MOCK_OFFICES[keyof typeof MOCK_OFFICES];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.featuredCard, { transform: [{ scale }] }]}>
        <ImageBackground
          source={office.heroImage}
          style={styles.featuredImageBg}
          imageStyle={{ borderRadius: 24 }}
        >
          {/* Use a simple overlay view since expo-linear-gradient requires installation and we just want a dark tint */}
          <View style={styles.featuredOverlay}>
            <View style={styles.featuredIconWrap}>
              <IconSymbol name={office.icon as any} size={24} color="#FFF" />
            </View>
            <View>
              <Text style={styles.featuredTitle}>{office.shortName}</Text>
              <Text style={styles.featuredDesc} numberOfLines={1}>
                {office.name}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

function ListCard({
  office,
  onPress,
}: {
  office: typeof MOCK_OFFICES[keyof typeof MOCK_OFFICES];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.listCard, { transform: [{ scale }] }]}>
        <View style={styles.listIconWrap}>
          <IconSymbol name={office.icon as any} size={24} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listTitle}>{office.shortName}</Text>
          <Text style={styles.listDesc} numberOfLines={1}>
            {office.location}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#C4C8D0" />
      </Animated.View>
    </Pressable>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const featuredOffices = [MOCK_OFFICES.health, MOCK_OFFICES.it, MOCK_OFFICES.career];
  const allOffices = Object.values(MOCK_OFFICES);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiRequest<{results: FAQ[]}>(`/faqs/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data.results);
      } catch (e) {
        console.error("Search failed:", e);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400); // debounce
    
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.header}>Support</Text>
        <Text style={styles.subHeader}>How can we help you today?</Text>
        
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="rgba(60, 60, 67, 0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs (e.g. hostel, tuition)"
            placeholderTextColor="rgba(60, 60, 67, 0.6)"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {query.trim().length > 0 ? (
          <View style={styles.searchResultsWrapper}>
            {isLoading ? (
              <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 40 }} />
            ) : results.length > 0 ? (
              <View style={styles.resultsGroup}>
                {results.map((faq, index) => (
                  <View key={faq.id} style={[
                    styles.faqRow,
                    index === results.length - 1 && styles.faqRowLast
                  ]}>
                    <Text style={styles.faqCategoryApple}>{faq.category.toUpperCase()}</Text>
                    <Text style={styles.faqQuestionApple}>{faq.question}</Text>
                    <Text style={styles.faqAnswerApple}>{faq.answer}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="magnifyingglass" size={48} color="#C4C8D0" />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyDesc}>We couldn't find anything matching "{query}".</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Essential Services</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                snapToInterval={280 + 16}
                decelerationRate="fast"
              >
                {featuredOffices.map((office) => (
                  <FeaturedCard
                    key={office.id}
                    office={office}
                    onPress={() => router.push({ pathname: "/(tabs)/help/[id]", params: { id: office.id } })}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={[styles.section, { paddingHorizontal: 20, marginTop: 12 }]}>
              <Text style={styles.sectionTitle}>All Departments</Text>
              <View style={styles.listContainer}>
                {allOffices.map((office) => (
                  <ListCard
                    key={office.id}
                    office={office}
                    onPress={() => router.push({ pathname: "/(tabs)/help/[id]", params: { id: office.id } })}
                  />
                ))}
              </View>
            </View>
          </>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fffaf3",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: "#A93C40",
    borderBottomWidth: 0,
  },
  header: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT_COLOR,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  
  // Featured Card (Carousel)
  featuredCard: {
    width: 280,
    height: 340,
    borderRadius: 24,
    shadowColor: TEXT_COLOR,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  featuredImageBg: {
    flex: 1,
    borderRadius: 24,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between",
  },
  featuredIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  featuredDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },

  // List Card
  listContainer: {
    gap: 12,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    shadowColor: TEXT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  listIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${PRIMARY_COLOR}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_COLOR,
    marginBottom: 2,
  },
  listDesc: {
    fontSize: 13,
    color: "#9BA3AE",
  },
  bottomSpacer: {
    height: 100,
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 17,
    color: "#000000",
    marginLeft: 8,
  },
  
  // Search Results
  searchResultsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultsGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
  },
  faqRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(60, 60, 67, 0.18)",
  },
  faqRowLast: {
    borderBottomWidth: 0,
  },
  faqCategoryApple: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  faqQuestionApple: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  faqAnswerApple: {
    fontSize: 15,
    color: "rgba(60, 60, 67, 0.6)",
    lineHeight: 20,
  },
  
  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_COLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: "#9BA3AE",
    textAlign: "center",
  },
});
