import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState, useEffect } from "react";
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

import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import {
  // getBiometricType,
  getBiometricTypeName,
  getBiometricSession,
  isBiometricAvailable,
  isBiometricLoginEnabled,
} from "@/lib/biometric";

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

type CheckEmailResponse = {
  exists: boolean;
  activated: boolean;
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithBiometrics, requestOtp } = useAuth();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState(""); // FIX #11: Removed hardcoded test email
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | "iris" | "undefined">("undefined");
  const pwRef = useRef<TextInput>(null);

  // Check biometric availability and auto-trigger on mount
  // Only show biometric if: available AND enabled AND has valid session stored
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricLoginEnabled();
      const hasSession = await getBiometricSession();
      
      if (available && enabled && hasSession) {
        setBiometricAvailable(true);
        // Auto-trigger biometric login
        setBiometricLoading(true);
        try {
          const result = await signInWithBiometrics();
          if (result.success) {
            router.replace("/(tabs)");
          }
          // If cancelled or failed, user will see the password form
        } catch (e) {
          // Silently fail - user will see the password form
        } finally {
          setBiometricLoading(false);
        }
      }
    };
    checkBiometric();
  }, []);

  const checkEmail = async () => {
    Keyboard.dismiss();
    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await apiRequest<CheckEmailResponse>("/auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.exists) {
        setError("Invalid email or password");
        return;
      }

      if (!res.activated) {
        try {
          await requestOtp(email.trim());
        } catch {
          /* ignore */
        }
        router.push({
          pathname: "/(auth)/activate",
          params: { email: email.trim() },
        });
        return;
      }

      setStep("password");
    } catch (e) {
      const err = e as Error & { status?: number; retryAfter?: number };

      // Handle rate limit (429) on check-email
      if (err.status === 429) {
        const retryAfter = err.retryAfter || 60;
        router.push({
          pathname: "/(auth)/rate-limit",
          params: {
            reason: "login_rate_limit",
            retryAfter: retryAfter.toString(),
            message: err.message,
          },
        });
        return;
      }

      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    Keyboard.dismiss();
    if (!password) {
      setError("Enter your password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await signIn(email.trim(), password);
      if ("needsActivation" in res && res.needsActivation) {
        router.push({
          pathname: "/(auth)/activate",
          params: { email: res.email || email },
        });
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      const error = e as Error & { status?: number; retryAfter?: number };

      // Handle account lockout (423) or rate limit (429)
      if (error.status === 423 || error.status === 429) {
        const retryAfter = error.retryAfter || 30; // default 30 seconds
        const reason =
          error.status === 423 ? "account_lockout" : "login_rate_limit";

        router.push({
          pathname: "/(auth)/rate-limit",
          params: {
            reason,
            retryAfter: retryAfter.toString(),
            message: error.message,
          },
        });
        return;
      }

      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError("");
    try {
      const result = await signInWithBiometrics();
      if (result.success) {
        router.replace("/(tabs)");
      } else if (!result.cancelled) {
        setError(result.error || "Biometric authentication failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Biometric authentication failed");
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.body}>
          <View style={s.logoWrap}>
            <Image
              source={require("@/assets/images/ashesi_logo.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>

          {step === "email" ? (
            <>
              <Text style={s.welcomeTitle}>Welcome Back</Text>
              <Text style={s.welcomeSub}>
                Sign in to your Fresher Hub account
              </Text>
            </>
          ) : (
            <>
              <Text style={s.passwordTitle}>Verify Password</Text>
              <Text style={s.passwordSub}>Enter your password to continue</Text>
            </>
          )}

          <View style={s.form}>
            {step === "email" ? (
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
                  onSubmitEditing={checkEmail}
                  editable={!loading}
                />
              </View>
            ) : (
              <View style={s.emailDisplay}>
                <Text style={s.emailLabelText}>{email}</Text>
              </View>
            )}

            {step === "password" && (
              <>
                <View style={[s.inputWrap, error && s.inputErr]}>
                  <View style={s.pwRow}>
                    <TextInput
                      ref={pwRef}
                      placeholder="Password"
                      placeholderTextColor={C.textSec}
                      secureTextEntry={!showPw}
                      style={s.pwInput}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setError("");
                      }}
                      returnKeyType="go"
                      onSubmitEditing={submitPassword}
                      editable={!loading}
                      autoFocus
                    />
                    <Pressable
                      onPress={() => setShowPw(!showPw)}
                      style={s.eyeBtn}
                    >
                      <Ionicons
                        name={showPw ? "eye-off" : "eye"}
                        size={22}
                        color={C.textSec}
                      />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={s.forgot}
                  onPress={() => router.push("/(auth)/forgot-password")}
                >
                  <Text style={s.forgotText}>Forgot password?</Text>
                </Pressable>
              </>
            )}

            {error ? <Text style={s.error}>{error}</Text> : null}

            {step === "email" ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    s.btn,
                    pressed && s.btnPressed,
                    loading && s.btnDisabled,
                  ]}
                  onPress={checkEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={s.btnText}>Continue</Text>
                  )}
                </Pressable>

                {/* Biometric login button - only show if available, enabled, AND has valid session */}
                {biometricAvailable && (
                  <Pressable
                    style={({ pressed }) => [
                      s.biometricBtn,
                      pressed && s.btnPressed,
                    ]}
                    onPress={handleBiometricLogin}
                    disabled={biometricLoading}
                  >
                    {biometricLoading ? (
                      <ActivityIndicator color={C.maroon} />
                    ) : (
                      <>
                        <Ionicons
                          name={biometricType === "face" ? "scan" : "finger-print"}
                          size={24}
                          color={C.maroon}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={s.biometricBtnText}>
                          Sign in with {getBiometricTypeName(biometricType)}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  s.btn,
                  pressed && s.btnPressed,
                  loading && s.btnDisabled,
                ]}
                onPress={submitPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.btnText}>Sign In</Text>
                )}
              </Pressable>
            )}
          </View>

          {step === "password" && (
            <Pressable
              style={s.backLink}
              onPress={() => {
                setStep("email");
                setError("");
                setPassword("");
              }}
            >
              <Text style={s.backLinkText}>Use a different email</Text>
            </Pressable>
          )}
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
  logoWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logo: { width: 120, height: 120 },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: C.maroon,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 15,
    color: C.textSec,
    marginBottom: 28,
    fontWeight: "400",
    lineHeight: 22,
  },
  passwordTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.maroon,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  passwordSub: {
    fontSize: 15,
    color: C.textSec,
    marginBottom: 28,
    fontWeight: "400",
  },
  form: { width: "100%", gap: 16 },
  inputWrap: {
    backgroundColor: C.grayBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: C.text,
    fontWeight: "500",
  },
  inputErr: { borderColor: C.error, backgroundColor: "#FFF7F7" },
  emailDisplay: {
    backgroundColor: C.grayBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emailLabelText: { fontSize: 16, color: C.text, fontWeight: "600" },
  pwRow: { flexDirection: "row", alignItems: "center" },
  pwInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: C.text,
    fontWeight: "500",
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 13 },
  forgot: { alignSelf: "flex-end", marginBottom: 4, marginTop: 4 },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.maroon,
    letterSpacing: 0.2,
  },
  error: {
    fontSize: 13,
    color: C.error,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  btn: {
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
  biometricBtn: {
    backgroundColor: C.grayBg,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  biometricBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.maroon,
    letterSpacing: 0.2,
  },
  backLink: { marginTop: 24, paddingVertical: 10 },
  backLinkText: {
    fontSize: 14,
    color: C.maroon,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});