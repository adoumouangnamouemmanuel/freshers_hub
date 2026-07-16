import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from "react-native";
import { useAuth } from "../../context/auth-context";
import { IconSymbol } from "../../components/ui/icon-symbol";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function BuddyUpScreen() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const user = session?.user;
  const [loading, setLoading] = useState(true);
  const [buddy, setBuddy] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_URL}/support/buddy`, { headers });
        if (res.ok) {
          const data = await res.json();
          setBuddy(data);
        }
      } catch (err) {
        console.error("Failed to fetch buddy pairing", err);
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchData();
  }, [token]);

  const handleWhatsAppContact = async () => {
    if (!buddy?.phone) return;
    
    // Log the click in the backend
    try {
      await fetch(`${API_URL}/support/contact`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          targetId: buddy.buddy_id,
          unitId: 4, // Assuming unit_id 4 is Buddy Up
          context: 'buddy_up_initial_contact'
        })
      });
    } catch (e) {
      console.warn("Failed to log contact click", e);
    }
    
    // Clean phone number (remove non-digits)
    const cleanPhone = buddy.phone.replace(/\D/g, '');
    const message = `Hi ${buddy.buddy_name}, I'm ${user?.fullName}, your assigned buddy from the Freshers Hub!`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        alert("WhatsApp is not installed on your device.");
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f1a17" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Buddy Up (OIPCC)</Text>
        <Text style={styles.subHeader}>
          Connect with your assigned senior international student buddy.
        </Text>
      </View>

      {buddy ? (
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{buddy.buddy_name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.buddyRole}>YOUR ASSIGNED BUDDY</Text>
              <Text style={styles.buddyName}>{buddy.buddy_name}</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <IconSymbol name="earth.americas.fill" size={16} color="#6B7280" />
              <Text style={styles.buddyDetails}>{buddy.buddy_country || "International"}</Text>
            </View>
            <View style={styles.detailItem}>
              <IconSymbol name="graduationcap.fill" size={16} color="#6B7280" />
              <Text style={styles.buddyDetails}>{buddy.buddy_major || "Student"}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <Text style={styles.cardDesc}>
            Your buddy is here to help you navigate campus life, cultural adjustment, and academics. Feel free to reach out to them on WhatsApp!
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleWhatsAppContact} activeOpacity={0.8}>
            <IconSymbol name="phone.fill" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Contact via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBg}>
            <IconSymbol name="person.2.fill" size={28} color="#9BA3AE" />
          </View>
          <Text style={styles.emptyTitle}>Pending Assignment</Text>
          <Text style={styles.emptyText}>You haven't been assigned a buddy yet. Check back soon.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  
  headerContainer: { marginBottom: 24 },
  header: { fontSize: 32, fontWeight: "900", color: "#1A2B4A", letterSpacing: -0.5 },
  subHeader: { fontSize: 16, color: "#6B7280", marginTop: 8, lineHeight: 24 },
  
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
    gap: 20,
  },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#25D366",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "900", color: "#FFFFFF" },
  profileInfo: { flex: 1, gap: 2 },
  buddyRole: { fontSize: 12, color: "#6B7280", fontWeight: "700", letterSpacing: 0.5 },
  buddyName: { fontSize: 22, fontWeight: "800", color: "#1A2B4A" },
  
  detailsRow: { flexDirection: "row", gap: 16 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  buddyDetails: { fontSize: 14, color: "#4B5563", fontWeight: "600" },
  
  divider: { height: 1, backgroundColor: "#F0F2F5", marginVertical: 4 },
  
  cardDesc: { fontSize: 15, color: "#6B7280", lineHeight: 22 },
  
  primaryButton: {
    backgroundColor: "#25D366", // WhatsApp Green
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  
  emptyCard: {
    padding: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    alignItems: "center",
    shadowColor: "#1A2B4A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
    gap: 12,
  },
  emptyIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F0F2F5", alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1A2B4A" },
  emptyText: { color: "#6B7280", fontSize: 15, textAlign: "center", lineHeight: 22 },
});
