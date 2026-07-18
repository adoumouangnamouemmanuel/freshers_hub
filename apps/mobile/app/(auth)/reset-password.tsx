import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";

// import { useAuth } from "@/context/auth-context";
import { verifyResetOtp, setNewPassword } from "@/lib/auth";

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

const OTP_LENGTH = 6;

type Step = "otp" | "password";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = useMemo(() => String(params.email || ""), [params.email]);

  const [step, setStep] = useState<Step>("otp");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const pwRef = useRef<TextInput>(null);
  const cfRef = useRef<TextInput>(null);

  const verifyOtp = async () => {
    Keyboard.dismiss();
    if (!otp || otp.length < OTP_LENGTH) { setError("Enter the full verification code"); return; }
    setLoading(true); setError("");
    try {
      await verifyResetOtp(email.trim(), otp.trim());
      setStep("password");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
    } finally { setLoading(false); }
  };

  const submit = async () => {
    Keyboard.dismiss();
    if (!newPw || newPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPw !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await setNewPassword(email.trim(), otp.trim(), newPw);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.center}>
          <View style={s.checkCircle}><Text style={s.checkIcon}>✓</Text></View>
          <Text style={s.bigTitle}>Password reset!</Text>
          <Text style={s.desc}>You can now sign in with your new password</Text>
          <Pressable style={s.btn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.btnText}>Sign In</Text>
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
          <Text style={s.title}>{step === "otp" ? "Verify OTP" : "New password"}</Text>
          {email ? <Text style={s.emailLabel}>{email}</Text> : null}

          {step === "otp" ? (
            <>
              <View style={s.otpRow}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <View key={i} style={[s.otpBox, otp[i] && s.otpBoxFilled]}>
                    <TextInput
                      ref={(ref) => { otpRefs.current[i] = ref; }}
                      style={s.otpBoxInput}
                      value={otp[i] || ""}
                      onChangeText={(char) => {
                        const digit = char.replace(/[^0-9]/g, "");
                        if (digit) {
                          const newOtp = otp.slice(0, i) + digit[0] + otp.slice(i + 1);
                          setOtp(newOtp);
                          if (i + 1 < OTP_LENGTH) {
                            setTimeout(() => otpRefs.current[i + 1]?.focus(), 0);
                          }
                        } else if (char === "") {
                          const newOtp = otp.slice(0, i) + otp.slice(i + 1);
                          setOtp(newOtp);
                          if (i > 0) {
                            setTimeout(() => otpRefs.current[i - 1]?.focus(), 0);
                          }
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      textContentType="oneTimeCode"
                      editable={!loading}
                    />
                  </View>
                ))}
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [s.btn, pressed && s.btnPressed, loading && s.btnDisabled]}
                onPress={verifyOtp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Verify OTP</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <View style={[s.inputWrap, error && s.inputErr]}>
                <View style={s.pwRow}>
                  <TextInput
                    ref={pwRef}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor={C.textSec}
                    secureTextEntry={!showPw}
                    style={s.pwInput}
                    value={newPw}
                    onChangeText={(t) => { setNewPw(t); setError(""); }}
                    returnKeyType="next"
                    onSubmitEditing={() => cfRef.current?.focus()}
                    editable={!loading}
                  />
                  <Pressable onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                    <Ionicons name={showPw ? "eye-off" : "eye"} size={22} color={C.textSec} />
                  </Pressable>
                </View>
              </View>

              <View style={[s.inputWrap, error && s.inputErr]}>
                <TextInput
                  ref={cfRef}
                  placeholder="Confirm new password"
                  placeholderTextColor={C.textSec}
                  secureTextEntry={!showPw}
                  style={s.input}
                  value={confirm}
                  onChangeText={(t) => { setConfirm(t); setError(""); }}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  editable={!loading}
                />
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [s.btn, pressed && s.btnPressed, loading && s.btnDisabled]}
                onPress={submit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Reset</Text>}
              </Pressable>
            </>
          )}
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
  title: { fontSize: 28, fontWeight: "800", color: C.maroon, marginBottom: 4 },
  emailLabel: { fontSize: 14, color: C.textSec, marginBottom: 24 },
  desc: { fontSize: 14, color: C.textSec, textAlign: "center", marginBottom: 28, lineHeight: 20 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 20 },
  otpBox: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.grayBg, alignItems: "center", justifyContent: "center" },
  otpBoxFilled: { borderColor: C.maroon, backgroundColor: "#FFF" },
  otpBoxInput: { width: "100%", height: "100%", textAlign: "center", textAlignVertical: "center", fontSize: 28, fontWeight: "800", color: C.text, padding: 0 },
  inputWrap: { width: "100%", backgroundColor: C.grayBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: "hidden" },
  inputErr: { borderColor: C.error, backgroundColor: "#FFF5F5" },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text },
  pwRow: { flexDirection: "row", alignItems: "center" },
  pwInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  error: { fontSize: 13, color: C.error, fontWeight: "600", textAlign: "center", marginBottom: 4 },
  btn: { width: "100%", backgroundColor: C.maroon, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFF", letterSpacing: 0.3 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8F8E8", alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 2, borderColor: C.success },
  checkIcon: { fontSize: 36, fontWeight: "900", color: C.success },
  bigTitle: { fontSize: 24, fontWeight: "800", color: C.maroon },
});