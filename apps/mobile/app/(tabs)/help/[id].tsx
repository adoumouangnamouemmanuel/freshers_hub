import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Linking,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOCK_OFFICES } from "@/lib/mock-data";

const PRIMARY_COLOR = "#A93C40";
const TEXT_COLOR = "#1A2B4A";
const HEADER_HEIGHT = 300;
const { width } = Dimensions.get("window");

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Pressable style={styles.faqCard} onPress={() => setExpanded(!expanded)}>
      <View style={styles.faqHeaderRow}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <IconSymbol name={expanded ? "chevron.down" : "chevron.right"} size={20} color={PRIMARY_COLOR} />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </Pressable>
  );
}

export default function OfficeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showAllStaff, setShowAllStaff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const office = id ? MOCK_OFFICES[id] : null;

  if (!office) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text>Office not found</Text>
      </View>
    );
  }

  const handleOpenLink = async (url: any) => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('https'))) {
        const WebBrowser = require('expo-web-browser');
        await WebBrowser.openBrowserAsync(url);
      } else if (typeof url === 'string' && (url.startsWith('mailto:') || url.startsWith('tel:'))) {
        await Linking.openURL(url).catch((err) => console.error("An error occurred", err));
      } else {
        // Assume it's a local asset (required)
        const { Asset } = require('expo-asset');
        const asset = Asset.fromModule(url);
        if (!asset.localUri) {
          await asset.downloadAsync();
        }
        
        if (asset.localUri) {
          const { Platform } = require('react-native');
          
          const isDocx = asset.type === 'docx' || asset.localUri?.toLowerCase().endsWith('.docx');
          const mimeType = isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';
          const uti = isDocx ? 'org.openxmlformats.wordprocessingml.document' : 'com.adobe.pdf';

          if (Platform.OS === 'android') {
            const IntentLauncher = require('expo-intent-launcher');
            const FileSystemLegacy = require('expo-file-system/legacy');
            const contentUri = await FileSystemLegacy.getContentUriAsync(asset.localUri);
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: contentUri,
              flags: 1,
              type: mimeType,
            });
          } else {
            const Sharing = require('expo-sharing');
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(asset.localUri, { UTI: uti, dialogTitle: 'View Document' });
            } else {
              alert('Sharing/viewing is not available on this device.');
            }
          }
        } else {
          alert('Could not download or locate the document.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error opening document.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleIntent = (type: "email" | "phone" | "whatsapp", value: string) => {
    let url = "";
    if (type === "email") url = `mailto:${value}`;
    if (type === "phone") url = `tel:${value}`;
    if (type === "whatsapp") url = `whatsapp://send?phone=${value.replace(/[^0-9]/g, "")}`;
    Linking.openURL(url).catch(() => alert(`Unable to open ${type}.`));
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_HEIGHT],
    outputRange: [0, 0, -HEADER_HEIGHT / 2],
    extrapolate: "clamp",
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.screen}>
      {/* Animated Parallax Header */}
      <Animated.Image
        source={office.heroImage}
        style={[
          styles.headerImage,
          {
            transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
          },
        ]}
      />
      <View style={[styles.headerOverlay, { height: HEADER_HEIGHT }]} />

      {/* Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: insets.top || 20 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFF" />
        </Pressable>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={{ paddingTop: HEADER_HEIGHT - 60 }}>
          {/* Main Content Card overlapping the image */}
          <View style={styles.contentContainer}>
            
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{office.name}</Text>
              <Text style={styles.desc}>{office.description}</Text>
            </View>

            {/* Quick Contact Actions (Floating Row) */}
            {office.contacts && (
              <View style={styles.quickActionsRow}>
                {office.contacts.phone && (
                  <Pressable style={styles.actionBtn} onPress={() => handleIntent("phone", office.contacts!.phone!)}>
                    <IconSymbol name="phone.fill" size={20} color="#FFF" />
                  </Pressable>
                )}
                {office.contacts.email && (
                  <Pressable style={styles.actionBtn} onPress={() => handleIntent("email", office.contacts!.email!)}>
                    <IconSymbol name="envelope.fill" size={20} color="#FFF" />
                  </Pressable>
                )}
                {office.contacts.whatsapp && (
                  <Pressable style={[styles.actionBtn, { backgroundColor: "#25D366" }]} onPress={() => handleIntent("whatsapp", office.contacts!.whatsapp!)}>
                    <FontAwesome5 name="whatsapp" size={20} color="#FFF" />
                  </Pressable>
                )}
              </View>
            )}

            {/* Info Cards */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <IconSymbol name="map.fill" size={20} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{office.location}</Text>
                </View>
                <Pressable 
                  style={styles.mapLinkBtn}
                  onPress={() => router.push({ pathname: "/(tabs)/map", params: { focusId: office.mapId || office.id } })}
                >
                  <Text style={styles.mapLinkText}>View on Map</Text>
                </Pressable>
              </View>

              <View style={[styles.infoRow, { borderTopWidth: 1, borderColor: "#F1F3F5", paddingTop: 16, marginTop: 16 }]}>
                <View style={styles.infoIcon}>
                  <IconSymbol name="calendar" size={20} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Operating Hours</Text>
                  <Text style={styles.infoValue}>{office.hours}</Text>
                </View>
              </View>
            </View>

            {/* External Links */}
            {office.links && office.links.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resources & Links</Text>
                <View style={styles.linkList}>
                  {office.links.map((link, index) => (
                    <Pressable
                      key={index}
                      style={styles.linkCard}
                      onPress={() => handleOpenLink(link.url)}
                    >
                      <View style={styles.linkIconWrapper}>
                        <IconSymbol name={link.icon as any} size={20} color={PRIMARY_COLOR} />
                      </View>
                      <Text style={styles.linkText}>{link.title}</Text>
                      <IconSymbol name="chevron.right" size={20} color="#C4C8D0" />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* FAQs */}
            {office.faqs && office.faqs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Frequently Asked</Text>
                <View style={styles.linkList}>
                  {office.faqs.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </View>
              </View>
            )}

            {/* Documents & Forms */}
            {office.documents && office.documents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Documents & Forms</Text>
                <View style={styles.linkList}>
                  {office.documents.map((doc, index) => (
                    <Pressable
                      key={index}
                      style={styles.linkCard}
                      onPress={() => handleOpenLink(doc.url)}
                    >
                      <View style={[styles.linkIconWrapper, { backgroundColor: "#A93C4015" }]}>
                        <IconSymbol name="newspaper.fill" size={20} color={PRIMARY_COLOR} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.linkText}>{doc.title}</Text>
                        <Text style={{ fontSize: 13, color: "#9BA3AE", marginTop: 2 }}>
                          {doc.type.toUpperCase()} • {doc.size}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color="#C4C8D0" />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Key Contacts Section */}
            {office.staff && office.staff.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Key Personnel</Text>
                  {office.staff.length > 3 && (
                    <Pressable onPress={() => setShowAllStaff(!showAllStaff)}>
                      <Text style={styles.viewAllText}>{showAllStaff ? "Show Less" : "View All"}</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.staffListContainer}>
                  {(showAllStaff ? office.staff : office.staff.slice(0, 3)).map((staff) => (
                    <View key={staff.id} style={styles.staffHorizontalCard}>
                      <Image source={staff.image} style={styles.avatarImageSmall} />
                      <View style={styles.staffInfoCol}>
                        <Text style={styles.staffNameHorizontal} numberOfLines={1}>{staff.name}</Text>
                        <Text style={styles.staffRoleHorizontal} numberOfLines={1}>{staff.role}</Text>
                      </View>
                      
                      <View style={styles.staffActionsHorizontal}>
                        <Pressable style={styles.staffActionBtnIconSmall} onPress={() => handleIntent("email", staff.email)}>
                          <IconSymbol name="envelope.fill" size={16} color={PRIMARY_COLOR} />
                        </Pressable>
                        
                        {staff.phone && (
                          <Pressable style={styles.staffActionBtnIconSmall} onPress={() => handleIntent("phone", staff.phone!)}>
                            <IconSymbol name="phone.fill" size={16} color={PRIMARY_COLOR} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: insets.bottom + 100 }} />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: HEADER_HEIGHT,
    resizeMode: "cover",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    backgroundColor: "rgba(0,0,0,0.35)", // Darkens the image for text readability if needed
  },
  navBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  contentContainer: {
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 20,
    minHeight: 1000,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: TEXT_COLOR,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: "#5f6874",
    lineHeight: 24,
  },

  // Action Buttons
  quickActionsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: TEXT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: `${PRIMARY_COLOR}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9BA3AE",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_COLOR,
  },
  mapLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: `${PRIMARY_COLOR}15`,
    borderRadius: 8,
  },
  mapLinkText: {
    color: PRIMARY_COLOR,
    fontSize: 12,
    fontWeight: "700",
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT_COLOR,
    marginBottom: 16,
  },
  linkList: {
    gap: 12,
  },
  linkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: TEXT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  linkIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${PRIMARY_COLOR}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_COLOR,
  },

  // FAQs
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: TEXT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  faqHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_COLOR,
    paddingRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#5f6874",
    lineHeight: 22,
    marginTop: 12,
  },

  // Staff
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    color: PRIMARY_COLOR,
    fontWeight: "700",
    fontSize: 14,
  },
  staffListContainer: {
    gap: 12,
  },
  staffHorizontalCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowColor: TEXT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarImageSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    marginRight: 12,
  },
  staffInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  staffNameHorizontal: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT_COLOR,
    marginBottom: 2,
  },
  staffRoleHorizontal: {
    fontSize: 13,
    color: "#C9933A", // Gold
    fontWeight: "600",
  },
  staffActionsHorizontal: {
    flexDirection: "row",
    gap: 8,
  },
  staffActionBtnIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${PRIMARY_COLOR}10`,
    alignItems: "center",
    justifyContent: "center",
  },
});
