import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  maroon: "#6B1D2A",
  maroonLight: "#8B3A4A",
  maroonBg: "#FDF2F4",
  grayBg: "#F5F5F7",
  border: "#E8E8ED",
  error: "#DC3545",
  success: "#28A745",
  warning: "#FFC107",
  text: "#1C1C1E",
  textSec: "#6C6C70",
  textTert: "#8E8E93",
  shadow: "rgba(0, 0, 0, 0.08)",
};

type RateLimitReason = 
  | "account_lockout" 
  | "login_rate_limit" 
  | "otp_request_limit" 
  | "password_reset_limit";

// Modern icon components using clean shapes
function LockIcon() {
  return (
    <View style={[iconStyles.container, { backgroundColor: "#FDF2F4", borderColor: "#FDDDE0" }]}>
      <View style={iconStyles.lockBody}>
        <View style={iconStyles.lockShackle} />
        <View style={iconStyles.lockKeyhole} />
      </View>
    </View>
  );
}

function ClockIcon() {
  return (
    <View style={[iconStyles.container, { backgroundColor: "#FFF8F0", borderColor: "#FEE4C8" }]}>
      <View style={iconStyles.clockFace}>
        <View style={iconStyles.clockHandHour} />
        <View style={iconStyles.clockHandMinute} />
        <View style={iconStyles.clockCenter} />
      </View>
    </View>
  );
}

function MailIcon() {
  return (
    <View style={[iconStyles.container, { backgroundColor: "#F0F7FF", borderColor: "#C8E2FF" }]}>
      <View style={iconStyles.mailEnvelope}>
        <View style={iconStyles.mailFlap} />
      </View>
    </View>
  );
}

function KeyIcon() {
  return (
    <View style={[iconStyles.container, { backgroundColor: "#F3F0FF", borderColor: "#D8CFFE" }]}>
      <View style={iconStyles.keyHead} />
      <View style={iconStyles.keyShaft} />
      <View style={iconStyles.keyNotch} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 24,
  },
  // Lock
  lockBody: {
    width: 28,
    height: 22,
    borderRadius: 4,
    backgroundColor: C.maroon,
    marginTop: 6,
  },
  lockShackle: {
    position: "absolute",
    top: -10,
    left: 4,
    width: 20,
    height: 14,
    borderWidth: 3,
    borderColor: C.maroon,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  lockKeyhole: {
    position: "absolute",
    top: 6,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  // Clock
  clockFace: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#E67E22",
  },
  clockHandHour: {
    position: "absolute",
    top: 10,
    left: 17.5,
    width: 2.5,
    height: 10,
    backgroundColor: "#E67E22",
    borderRadius: 1.5,
    transform: [{ rotate: "-30deg" }],
    transformOrigin: "bottom",
  },
  clockHandMinute: {
    position: "absolute",
    top: 6,
    left: 17.5,
    width: 2,
    height: 14,
    backgroundColor: "#E67E22",
    borderRadius: 1,
  },
  clockCenter: {
    position: "absolute",
    top: 16,
    left: 16.5,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#E67E22",
  },
  // Mail
  mailEnvelope: {
    width: 32,
    height: 22,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  mailFlap: {
    position: "absolute",
    top: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 12,
    borderLeftColor: "#3B82F6",
    borderRightColor: "#3B82F6",
    borderBottomColor: "#2563EB",
  },
  // Key
  keyHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    marginRight: -6,
    zIndex: 1,
  },
  keyShaft: {
    position: "absolute",
    left: 34,
    width: 16,
    height: 4,
    backgroundColor: "#7C3AED",
    borderRadius: 2,
    top: 6,
  },
  keyNotch: {
    position: "absolute",
    left: 38,
    top: 10,
    width: 8,
    height: 3,
    backgroundColor: "#7C3AED",
    borderRadius: 1.5,
  },
});

export default function RateLimitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string; retryAfter?: string; message?: string }>();
  
  const reason = useMemo(() => (params.reason || "account_lockout") as RateLimitReason, [params.reason]);
  const retryAfter = useMemo(() => parseInt(params.retryAfter || "0", 10), [params.retryAfter]);
  // const message = useMemo(() => params.message || "", [params.message]);
  
  const [countdown, setCountdown] = useState(retryAfter);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    setCountdown(retryAfter);
  }, [retryAfter]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Pulse animation for countdown circle when timer > 0
  useEffect(() => {
    if (countdown <= 0) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [countdown, pulseAnim]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
  };

  const getIcon = () => {
    switch (reason) {
      case "account_lockout": return <LockIcon />;
      case "login_rate_limit": return <ClockIcon />;
      case "otp_request_limit": return <MailIcon />;
      case "password_reset_limit": return <KeyIcon />;
      default: return <ClockIcon />;
    }
  };

  const getTitle = () => {
    switch (reason) {
      case "account_lockout": return "Account Locked";
      case "login_rate_limit": return "Too Many Attempts";
      case "otp_request_limit": return "Too Many Requests";
      case "password_reset_limit": return "Too Many Requests";
      default: return "Please Wait";
    }
  };

  const getDescription = () => {
    switch (reason) {
      case "account_lockout":
        return "For your security, this account has been temporarily locked due to multiple failed login attempts.";
      case "login_rate_limit":
        return "You've made too many login attempts. Please wait a moment before trying again.";
      case "otp_request_limit":
        return "You've requested verification codes too many times. Please wait before requesting another.";
      case "password_reset_limit":
        return "You've requested too many password resets. Please wait before trying again.";
      default:
        return "Please wait before continuing.";
    }
  };

  const getAccentColor = () => {
    switch (reason) {
      case "account_lockout": return C.error;
      case "login_rate_limit": return "#E67E22";
      case "otp_request_limit": return "#3B82F6";
      case "password_reset_limit": return "#7C3AED";
      default: return C.maroon;
    }
  };

  const getActionButton = () => {
    if (countdown === 0) {
      switch (reason) {
        case "account_lockout":
        case "login_rate_limit":
          return {
            label: "Try Again",
            onPress: () => router.replace("/(auth)/login"),
          };
        case "otp_request_limit":
          return {
            label: "Back to Activation",
            onPress: () => router.back(),
          };
        case "password_reset_limit":
          return {
            label: "Back to Reset",
            onPress: () => router.back(),
          };
      }
    }
    return null;
  };

  const actionButton = getActionButton();
  const accentColor = getAccentColor();

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.container}>
        {/* Top section with icon and title */}
        <View style={s.topSection}>
          {getIcon()}
          <Text style={s.title}>{getTitle()}</Text>
          <Text style={s.description}>{getDescription()}</Text>
        </View>

        {/* Countdown timer */}
        {countdown > 0 ? (
          <Animated.View style={[s.countdownContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[s.countdownCircle, { borderColor: accentColor }]}>
              <Text style={[s.countdownText, { color: accentColor }]}>{formatTime(countdown)}</Text>
              <Text style={[s.countdownLabel, { color: accentColor }]}>Waiting period</Text>
            </View>
          </Animated.View>
        ) : (
          <View style={s.successContainer}>
            <View style={[s.successDot, { backgroundColor: C.success }]} />
            <Text style={s.successText}>You may try again now</Text>
          </View>
        )}

        {/* Info card */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>What happens next?</Text>
          <View style={s.infoRow}>
            <View style={[s.infoDot, { backgroundColor: accentColor }]} />
            <Text style={s.infoText}>Wait for the timer to complete</Text>
          </View>
          <View style={s.infoRow}>
            <View style={[s.infoDot, { backgroundColor: accentColor }]} />
            <Text style={s.infoText}>
              {reason === "otp_request_limit" 
                ? "Navigate back once the waiting period ends" 
                : "Use the Forgot password? option if needed"}
            </Text>
          </View>
          <View style={s.infoRow}>
            <View style={[s.infoDot, { backgroundColor: accentColor }]} />
            <Text style={s.infoText}>Contact support if you believe this is an error</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionsContainer}>
          {actionButton && (
            <Pressable
              style={[s.primaryButton, { backgroundColor: accentColor }]}
              onPress={actionButton.onPress}
            >
              <Text style={s.primaryButtonText}>{actionButton.label}</Text>
            </Pressable>
          )}

          {(reason === "account_lockout" || reason === "login_rate_limit") && (
            <Pressable
              style={s.secondaryButton}
              onPress={() => router.replace("/(auth)/forgot-password")}
            >
              <Text style={[s.secondaryButtonText, { color: accentColor }]}>Reset Password</Text>
            </Pressable>
          )}

          <Pressable
            style={s.tertiaryButton}
            onPress={() => {
              if (reason === "account_lockout" || reason === "login_rate_limit") {
                router.replace("/(auth)/login");
              } else {
                router.back();
              }
            }}
          >
            <Text style={s.tertiaryButtonText}>Go Back</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Need help? Contact support@fresherhub.com</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: C.textSec,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  countdownContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  countdownCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  countdownText: {
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
    opacity: 0.7,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32,
    gap: 10,
  },
  successDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  successText: {
    fontSize: 17,
    fontWeight: "600",
    color: C.success,
  },
  infoCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: C.textSec,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
    paddingTop: 8,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  tertiaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: C.textTert,
  },
  footer: {
    alignItems: "center",
    paddingTop: 12,
  },
  footerText: {
    fontSize: 13,
    color: C.textTert,
    fontWeight: "400",
  },
});