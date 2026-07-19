import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

// Keys for secure storage
const BIOMETRIC_ENABLED_KEY = "fresher-hub.biometric-enabled";
const BIOMETRIC_EMAIL_KEY = "fresher-hub.biometric-email";
const BIOMETRIC_SESSION_KEY = "fresher-hub.biometric-session";
const BIOMETRIC_SESSION_TIMESTAMP_KEY = "fresher-hub.biometric-session-timestamp";

// Biometric session timeout in milliseconds (90 days - matches backend refresh token duration)
const BIOMETRIC_SESSION_TIMEOUT = 90 * 24 * 60 * 60 * 1000;

// Check if biometric authentication is available on the device
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error("Error checking biometric availability:", error);
    return false;
  }
}

// Get the authentication type (face, fingerprint, etc.)
export async function getBiometricType(): Promise<
  "face" | "fingerprint" | "iris" | "undefined"
> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    // Check for fingerprint first (most common on Android)
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "face";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return "iris";
    }
    return "undefined";
  } catch (error) {
    console.error("Error getting biometric type:", error);
    return "undefined";
  }
}

// Authenticate user with biometrics
export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  error?: string;
  cancelled?: boolean;
}> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to Freshers Hub",
      cancelLabel: "Use password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    // User cancelled or authentication failed
    return {
      success: false,
      cancelled: result.error === "user_cancel",
      error: result.error || "Authentication failed",
    };
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

// Enable biometric login - store email securely (without verification)
export async function enableBiometricLogin(email: string): Promise<void> {
  try {
    // Store that biometric is enabled
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true", {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    // Store the email associated with biometric login
    await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error("Error enabling biometric login:", error);
    throw new Error("Failed to enable biometric login");
  }
}

// Enable biometric login with verification (for settings)
export async function enableBiometricLoginWithVerification(
  email: string,
  session: { accessToken: string; refreshToken: string },
): Promise<void> {
  try {
    // First verify the user's identity with biometrics
    const authResult = await authenticateWithBiometrics();
    if (!authResult.success) {
      throw new Error(authResult.error || "Biometric verification failed");
    }

    // Store that biometric is enabled
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true", {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    // Store the email associated with biometric login
    await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    // Store the session tokens
    const sessionToStore = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
    console.log("Storing biometric session with tokens:", {
      accessToken: session.accessToken ? "exists" : "null",
      refreshToken: session.refreshToken ? "exists" : "null",
    });
    await SecureStore.setItemAsync(
      BIOMETRIC_SESSION_KEY,
      JSON.stringify(sessionToStore),
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
    // Store the timestamp for timeout
    await SecureStore.setItemAsync(
      BIOMETRIC_SESSION_TIMESTAMP_KEY,
      Date.now().toString(),
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
    console.log("Biometric session stored for email:", email);
  } catch (error) {
    console.error("Error enabling biometric login with verification:", error);
    throw error;
  }
}

// Disable biometric login
export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Error disabling biometric login:", error);
    throw new Error("Failed to disable biometric login");
  }
}

// Check if biometric login is enabled
export async function isBiometricLoginEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === "true";
  } catch (error) {
    console.error("Error checking biometric login status:", error);
    return false;
  }
}

// Get the email associated with biometric login
export async function getBiometricEmail(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
  } catch (error) {
    console.error("Error getting biometric email:", error);
    return null;
  }
}

// Store session data for biometric login (encrypted)
export async function storeBiometricSession(session: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  try {
    // We store only the tokens, not user data (user data is in regular session)
    // This allows quick re-authentication without storing sensitive user info
    await SecureStore.setItemAsync(
      BIOMETRIC_SESSION_KEY,
      JSON.stringify(session),
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
    // Store the timestamp for timeout
    await SecureStore.setItemAsync(
      BIOMETRIC_SESSION_TIMESTAMP_KEY,
      Date.now().toString(),
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
  } catch (error) {
    console.error("Error storing biometric session:", error);
    throw new Error("Failed to store session");
  }
}

// Get stored session for biometric login
export async function getBiometricSession(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const data = await SecureStore.getItemAsync(BIOMETRIC_SESSION_KEY);
    console.log("getBiometricSession - raw data:", data ? "exists" : "null");
    if (!data) return null;
    
    // Check if session has expired (90 day timeout)
    const timestamp = await SecureStore.getItemAsync(BIOMETRIC_SESSION_TIMESTAMP_KEY);
    if (timestamp) {
      const storedTime = parseInt(timestamp, 10);
      const now = Date.now();
      if (now - storedTime > BIOMETRIC_SESSION_TIMEOUT) {
        console.log("Biometric session expired (90 day timeout)");
        return null;
      }
    }
    
    const parsed = JSON.parse(data);
    console.log("getBiometricSession - parsed successfully");
    return parsed;
  } catch (error) {
    console.error("Error getting biometric session:", error);
    return null;
  }
}

// Clear biometric session data (on logout) - but keep the enabled flag
export async function clearBiometricSession(): Promise<void> {
  try {
    // Only clear the session data, not the enabled flag
    // This allows biometric to be shown on login screen but require password first
    await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Error clearing biometric session:", error);
  }
}

// Get user-friendly authentication type name (platform-specific)
export function getBiometricTypeName(
  type: "face" | "fingerprint" | "iris" | "undefined",
): string {
  // Return platform-specific name
  switch (type) {
    case "face":
      return "Face ID";
    case "fingerprint":
      return "Fingerprint";
    case "iris":
      return "Iris";
    default:
      return "Biometrics";
  }
}