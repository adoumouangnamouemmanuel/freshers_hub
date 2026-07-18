import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/auth-context";

const C = {
  bg: "#FFFFFF",
  maroon: "#6B1D2A",
  grayBg: "#F5F5F7",
  border: "#E5E5EA",
  error: "#FF3B30",
  success: "#34C759",
  text: "#1C1C1E",
  textSec: "#8E8E93",
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    Keyboard.dismiss();
    if (!email.trim()) { setError("Enter your email address"); return; }
    setLoading(true); setError("");
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.center}>
          <Text style={s.title}>Check your email</Text>
          <Text style={s.desc}>A verification code has been sent to{'\n'}{email}</Text>
          <View style={s.devBox}>
            <Text style={s.devText}>Dev: check the server console for the OTP</Text>
          </View>
          <Pressable style={s.btn} onPress={() => router.push({ pathname: "/(auth)/reset-password", params: { email } })}>
            <Text style={s.btnText}>I have the code</Text>
          </Pressable>
          <Pressable style={s.link} onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.linkText}>Back to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.body}>
          <Pressable style={s.back} onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>

          <Image source={require("@/assets/images/ashesi_logo.png")} style={s.logo} resizeMode="contain" />
          <Text style={s.title}>Reset password</Text>
          <Text style={s.descEnter}>Enter your email to receive a verification code</Text>

          <View style={[s.inputWrap, error && s.inputErr]}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={C.textSec}
              style={s.input}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              returnKeyType="go"
              onSubmitEditing={submit}
              editable={!loading}
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable style={({ pressed }) => [s.btn, pressed && s.btnPressed, loading && s.btnDisabled]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Send code</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, paddingHorizontal: 32, justifyContent: "center", alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg, paddingHorizontal: 32 },
  back: { position: "absolute", top: 16, left: 24, zIndex: 10 },
  backText: { fontSize: 16, fontWeight: "600", color: C.maroon },
  logo: { width: 80, height: 80, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: C.maroon, marginBottom: 8 },
  descEnter: { fontSize: 14, color: C.textSec, textAlign: "center", marginBottom: 28 },
  desc: { fontSize: 14, color: C.textSec, textAlign: "center", marginBottom: 20, lineHeight: 22 },
  inputWrap: { width: "100%", backgroundColor: C.grayBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: "hidden" },
  inputErr: { borderColor: C.error, backgroundColor: "#FFF5F5" },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text },
  error: { fontSize: 13, color: C.error, fontWeight: "600", textAlign: "center", marginBottom: 4 },
  btn: { width: "100%", backgroundColor: C.maroon, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFF", letterSpacing: 0.3 },
  devBox: { backgroundColor: "#FFFBEB", borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: "#FDE68A", width: "100%" },
  devText: { fontSize: 12, color: "#92400E", fontWeight: "600", textAlign: "center" },
  link: { marginTop: 20 },
  linkText: { fontSize: 14, color: C.maroon, fontWeight: "600" },
});