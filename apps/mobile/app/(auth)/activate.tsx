import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

export default function ActivateScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ email?: string }>();
  const email   = useMemo(() => String(params.email || ""), [params.email]);
  const { activate } = useAuth();

  const [otp,        setOtp]        = useState("123456");
  const [password,   setPassword]   = useState("Pass123!Abc");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [focused,    setFocused]    = useState<"otp"|"pw"|null>(null);

  const submit = async () => {
    if (!email) { setError("Missing email — go back."); return; }
    setSubmitting(true); setError("");
    try {
      await activate(email, otp.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.center}>

          {/* Back */}
          <Pressable style={s.backRow} onPress={() => router.back()}>
            <Text style={s.backLabel}>← Back</Text>
          </Pressable>

          {/* Top */}
          <View style={s.topBlock}>
            <Text style={s.step}>ACCOUNT SETUP</Text>
            <Text style={s.title}>Activate your{"\n"}account</Text>
            <View style={s.emailTag}>
              <Text style={s.emailTagText} numberOfLines={1}>{email}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={s.form}>

            {/* OTP */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>One-time code</Text>
              <TextInput
                keyboardType="number-pad"
                placeholder="· · · · · ·"
                placeholderTextColor={BORDER}
                style={[s.otpInput, focused === "otp" && s.inputOn]}
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
                onFocus={() => setFocused("otp")}
                onBlur={() => setFocused(null)}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>Choose a password</Text>
              <TextInput
                placeholder="Min. 8 characters"
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
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [s.btn, pressed && s.btnDark, submitting && s.btnFaded]}
              onPress={submit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={WHITE} />
                : <Text style={s.btnLabel}>Activate & enter</Text>}
            </Pressable>
          </View>

          <Text style={s.footer}>
            Remember your password — you'll use it every time you sign in.
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

  /* Back */
  backRow: {
    position: "absolute",
    top: 16,
    left: 32,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: GRAY,
  },

  /* Top block */
  topBlock: {
    alignItems: "center",
    gap: 10,
  },
  step: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    color: GOLD,
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: NAVY,
    letterSpacing: -0.5,
    textAlign: "center",
    lineHeight: 38,
  },
  emailTag: {
    backgroundColor: LIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: "85%",
  },
  emailTagText: {
    fontSize: 13,
    color: GRAY,
    fontWeight: "500",
    textAlign: "center",
  },

  /* Form */
  form: {
    width: "100%",
    gap: 16,
  },
  field: {
    gap: 8,
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: GRAY,
    textTransform: "uppercase",
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
  otpInput: {
    width: "100%",
    backgroundColor: LIGHT,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: 12,
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
