import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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

const C = {
  bg: "#FFFFFF",
  maroon: "#6B1D2A",
  grayBg: "#F5F5F7",
  border: "#E5E5EA",
  error: "#FF3B30",
  text: "#1C1C1E",
  textSec: "#8E8E93",
};

type CheckEmailResponse = {
  exists: boolean;
  activated: boolean;
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, requestOtp } = useAuth();

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("fresher.one@ashesi.edu.gh");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pwRef = useRef<TextInput>(null);

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
        const reason = error.status === 423 ? "account_lockout" : "login_rate_limit";
        
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
              <Text style={s.welcomeTitle}>Welcome</Text>
              <Text style={s.welcomeSub}>
                Sign in to your Fresher Hub account
              </Text>
            </>
          ) : (
            <Text style={s.passwordSub}>Enter your password to continue</Text>
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
              <Text style={s.backLinkText}>← Use a different email</Text>
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
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrap: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: { width: 110, height: 110 },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: C.maroon,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeSub: { fontSize: 15, color: C.textSec, marginBottom: 16 },
  passwordSub: { fontSize: 15, color: C.textSec, marginBottom: 16 },
  form: { width: "100%", gap: 14 },
  inputWrap: {
    backgroundColor: C.grayBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
  },
  inputErr: { borderColor: C.error, backgroundColor: "#FFF5F5" },
  emailDisplay: {
    backgroundColor: C.grayBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  emailLabelText: { fontSize: 16, color: C.text, fontWeight: "500" },
  pwRow: { flexDirection: "row", alignItems: "center" },
  pwInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  forgot: { alignSelf: "flex-end", marginBottom: 4, marginTop: -4 },
  forgotText: { fontSize: 13, fontWeight: "600", color: C.maroon },
  error: {
    fontSize: 13,
    color: C.error,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  btn: {
    backgroundColor: C.maroon,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  backLink: { marginTop: 20, paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: C.maroon, fontWeight: "600" },
});
