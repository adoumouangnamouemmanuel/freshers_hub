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
  maroonLight: "#8B2E3D",
  grayBg: "#F9F9FB",
  border: "#E8E8ED",
  error: "#DC3545",
  success: "#28A745",
  text: "#1C1C1E",
  textSec: "#86868B",
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
    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email.trim());
      // Always show success message (prevents user enumeration)
      setSent(true);
    } catch (e) {
      const err = e as Error & { status?: number; retryAfter?: number };

      // Handle rate limit (429) - navigate to rate-limit screen
      if (err.status === 429) {
        const retryAfter = err.retryAfter || 3600;
        router.replace({
          pathname: "/(auth)/rate-limit",
          params: {
            reason: "password_reset_limit",
            retryAfter: retryAfter.toString(),
            message: err.message,
          },
        });
        return;
      }

      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.center}>
          <View style={s.checkCircle}>
            <Text style={s.checkIcon}>✓</Text>
          </View>
          <Text style={s.bigTitle}>Check your email</Text>
          <Text style={s.desc}>
            If an account exists and is activated, a verification code has been
            sent to {email}
          </Text>
          <View style={s.devBox}>
            <Text style={s.devText}>Dev: check server console for OTP</Text>
          </View>
          
          {/* Resend with cooldown */}
          <View style={s.resendRow}>
            <Text style={s.resendPrompt}>Did not receive the code? </Text>
            <Pressable onPress={submit} disabled={loading}>
              <Text style={[s.resendLink, loading && s.resendDisabled]}>Resend</Text>
            </Pressable>
          </View>

          <Pressable
            style={s.btn}
            onPress={() =>
              router.push({
                pathname: "/(auth)/reset-password",
                params: { email },
              })
            }
          >
            <Text style={s.btnText}>I have the code</Text>
          </Pressable>

          <Pressable
            style={s.link}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={s.linkText}>Back to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.body}>
          <Pressable style={s.back} onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>

          <Image
            source={require("@/assets/images/ashesi_logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.title}>Reset Password</Text>
          <Text style={s.descEnter}>
            Enter your email to receive a verification code
          </Text>

          <View style={[s.inputWrap, error && s.inputErr]}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={C.textSec}
              style={s.input}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError("");
              }}
              returnKeyType="go"
              onSubmitEditing={submit}
              editable={!loading}
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              s.btn,
              pressed && s.btnPressed,
              loading && s.btnDisabled,
            ]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.btnText}>Send code</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    paddingHorizontal: 28,
  },
  back: { position: "absolute", top: 16, left: 24, zIndex: 10 },
  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.maroon,
    letterSpacing: 0.2,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: C.maroon,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  descEnter: {
    fontSize: 15,
    color: C.textSec,
    textAlign: "center",
    marginBottom: 28,
    fontWeight: "400",
    lineHeight: 22,
  },
  desc: {
    fontSize: 15,
    color: C.textSec,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: "400",
  },
  inputWrap: {
    width: "100%",
    backgroundColor: C.grayBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputErr: { borderColor: C.error, backgroundColor: "#FFF7F7" },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: C.text,
    fontWeight: "500",
  },
  error: {
    fontSize: 13,
    color: C.error,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  btn: {
    width: "100%",
    backgroundColor: C.maroon,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#6B1D2A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: C.success,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  checkIcon: { fontSize: 48, fontWeight: "900", color: C.success },
  bigTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: C.maroon,
    marginBottom: 8,
  },
  devBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    width: "100%",
  },
  devText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    textAlign: "center",
  },
  link: { marginTop: 24, paddingVertical: 10 },
  linkText: {
    fontSize: 14,
    color: C.maroon,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  resendPrompt: {
    fontSize: 14,
    color: C.textSec,
    fontWeight: "400",
  },
  resendLink: {
    fontSize: 14,
    color: C.maroon,
    fontWeight: "600",
  },
  resendDisabled: {
    opacity: 0.5,
  },
});
