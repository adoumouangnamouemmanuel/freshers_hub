import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Dimensions, ImageBackground } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Link } from "expo-router";
import React, { useRef } from "react";
import { IconSymbol, IconSymbolName } from "../../components/ui/icon-symbol";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const SPACING = 20;

type SupportUnit = {
  iconName: IconSymbolName;
  name: string;
  tagline: string;
  desc: string;
  href: string;
  color: string;
  darkColor: string;
};

const SUPPORT_UNITS: SupportUnit[] = [
  {
    iconName: "person.2.fill",
    name: "Peer Coaching",
    tagline: "Track Your Journey",
    desc: "Mandatory coaching sessions designed to help you thrive in your first semester.",
    href: "/support/coaching",
    color: "#FF6B6B",
    darkColor: "#A93C40",
  },
  {
    iconName: "cross.case.fill",
    name: "Counselling",
    tagline: "Confidential Support",
    desc: "Professional mental health & wellbeing support tailored to your needs.",
    href: "/support/counselling",
    color: "#FFD166",
    darkColor: "#C9933A",
  },
  {
    iconName: "book.fill",
    name: "Advising",
    tagline: "Academic Excellence",
    desc: "Expert guidance on your courses, majors, and university policies.",
    href: "/support/advising",
    color: "#4D96FF",
    darkColor: "#1A2B4A",
  },
  {
    iconName: "earth.americas.fill",
    name: "Buddy Up",
    tagline: "Global Connections",
    desc: "Connect with a senior international student and discover the community.",
    href: "/support/buddy-up",
    color: "#6BCB77",
    darkColor: "#25D366",
  },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  
  return (
    <View style={styles.screen}>
      {/* Decorative Background Elements */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.headerContainer}>
          <Text style={styles.greeting}>How can we help?</Text>
          <Text style={styles.header}>Support Hub</Text>
          <Text style={styles.subHeader}>
            Swipe through your dedicated campus resources.
          </Text>
        </View>

        <View style={styles.carouselContainer}>
          <Animated.ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: (width - CARD_WIDTH) / 2 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {SUPPORT_UNITS.map((unit, index) => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + SPACING),
                index * (CARD_WIDTH + SPACING),
                (index + 1) * (CARD_WIDTH + SPACING),
              ];
              
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: "clamp",
              });
              
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.6, 1, 0.6],
                extrapolate: "clamp",
              });

              return (
                <Link href={unit.href as any} key={unit.name} asChild>
                  <TouchableOpacity activeOpacity={0.9} style={{ width: CARD_WIDTH, marginRight: SPACING }}>
                    <Animated.View style={[styles.card, { backgroundColor: unit.darkColor, transform: [{ scale }], opacity }]}>
                      
                      {/* Abstract Background Icon */}
                      <View style={styles.watermarkContainer}>
                        <IconSymbol name={unit.iconName} size={240} color="rgba(255,255,255,0.06)" />
                      </View>
                      
                      <View style={styles.cardContent}>
                        <View style={styles.cardTop}>
                          <View style={[styles.iconWrapper, { backgroundColor: unit.color }]}>
                            <IconSymbol name={unit.iconName} size={32} color="#FFFFFF" />
                          </View>
                          <View style={styles.taglineBadge}>
                            <Text style={[styles.taglineText, { color: unit.color }]}>{unit.tagline}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.cardBottom}>
                          <Text style={styles.cardTitle}>{unit.name}</Text>
                          <Text style={styles.cardDesc}>{unit.desc}</Text>
                          
                          <View style={styles.actionRow}>
                            <Text style={styles.actionText}>Enter Hub</Text>
                            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </Animated.ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A", // Deep premium dark background
  },
  bgBlob1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#3B82F6",
    opacity: 0.15,
    transform: [{ scaleX: 1.5 }],
  },
  bgBlob2: {
    position: "absolute",
    bottom: -50,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#10B981",
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  header: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  subHeader: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 12,
    lineHeight: 24,
    maxWidth: "80%",
  },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 60,
  },
  card: {
    flex: 1,
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
    minHeight: 450,
  },
  watermarkContainer: {
    position: "absolute",
    bottom: -40,
    right: -40,
    transform: [{ rotate: "-15deg" }],
  },
  cardContent: {
    flex: 1,
    padding: 30,
    justifyContent: "space-between",
  },
  cardTop: {
    alignItems: "flex-start",
    gap: 16,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  taglineBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardBottom: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  cardDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 22,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
