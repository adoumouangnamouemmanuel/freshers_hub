import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";

const RED   = "#A93C40";
const RED_D = "#7E2D30";
const GOLD  = "#C9933A";
const NAVY  = "#1A2B4A";
const GRAY  = "#9BA3AE";
const LIGHT = "#F6F7F9";
const WHITE = "#FFFFFF";
const BORDER = "#E4E7EC";

export default function LoginScreen() {
  const router  = useRouter();
  const { signIn } = useAuth();

  const [email,       setEmail]       = useState("fresher.one@ashesi.edu.gh");
  const [password,    setPassword]    = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [focused,     setFocused]     = useState<"email"|"pw"|null>(null);

  const submit = async () => {
    if (!password) { setError("Enter your password to continue."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await signIn(email.trim(), password);
      if ("needsActivation" in res && res.needsActivation) {
        router.push({ pathname: "/(auth)/activate", params: { email: res.email || email } });
      } else {
        // Successful login — navigate explicitly (don't rely solely on the layout guard)
        router.replace("/(tabs)");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.center}>

          {/* ── Logo ── */}
          <View style={s.logoBlock}>
            <View style={s.logoCircle}>
              <Text style={s.logoA}>A</Text>
            </View>
            <Text style={s.university}>ASHESI UNIVERSITY</Text>
            <Text style={s.appTitle}>Fresher Hub</Text>
          </View>

          {/* ── Divider ── */}
          <View style={s.divider} />

          {/* ── Form ── */}
          <View style={s.form}>
            <TextInput
              autoCapitalize="none" autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor={GRAY}
              style={[s.input, focused === "email" && s.inputOn]}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              returnKeyType="next"
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={GRAY}
              secureTextEntry
              style={[s.input, focused === "pw" && s.inputOn]}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused("pw")}
              onBlur={() => setFocused(null)}
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [s.btn, pressed && s.btnDark, submitting && s.btnFaded]}
              onPress={submit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={WHITE} />
                : <Text style={s.btnLabel}>Sign in</Text>}
            </Pressable>
          </View>

          {/* ── Footer ── */}
          <Text style={s.footer}>
            First time? You'll be asked to set a password.
          </Text>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: WHITE },
  kav: { flex: 1 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 28,
  },

  /* Logo block */
  logoBlock: {
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: RED,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 4,
  },
  logoA: {
    fontSize: 42,
    fontWeight: "900",
    color: WHITE,
    lineHeight: 50,
  },
  university: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    color: GOLD,
    textAlign: "center",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: NAVY,
    letterSpacing: -0.5,
    textAlign: "center",
  },

  /* Divider */
  divider: {
    width: 40,
    height: 2,
    borderRadius: 2,
    backgroundColor: BORDER,
  },

  /* Form */
  form: {
    width: "100%",
    gap: 12,
  },
  input: {
    width: "100%",
    backgroundColor: LIGHT,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: NAVY,
    textAlign: "center",
  },
  inputOn: {
    borderColor: RED,
    backgroundColor: WHITE,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  error: {
    textAlign: "center",
    fontSize: 13,
    color: RED,
    fontWeight: "500",
  },
  btn: {
    width: "100%",
    backgroundColor: RED,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 4,
  },
  btnDark:  { backgroundColor: RED_D, shadowOpacity: 0.15 },
  btnFaded: { opacity: 0.65, shadowOpacity: 0 },
  btnLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: WHITE,
    letterSpacing: 0.2,
  },

  /* Footer */
  footer: {
    fontSize: 13,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
  },
});
