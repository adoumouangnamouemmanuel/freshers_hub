import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clearSession,
  forgotPassword as forgotPasswordApi,
  loadSession,
  loginWithPassword,
  logout as logoutApi,
  refreshSession,
  requestOtp as requestOtpApi,
  saveSession,
  setPassword as setPasswordApi,
  type AuthSession,
  verifyOtp as verifyOtpApi,
  verifyResetOtp as verifyResetOtpApi,
  setNewPassword as setNewPasswordApi,
} from "@/lib/auth";
import {
  authenticateWithBiometrics,
  clearBiometricSession,
  disableBiometricLogin,
  enableBiometricLoginWithVerification,
  getBiometricSession,
  isBiometricAvailable,
  isBiometricLoginEnabled,
  storeBiometricSession,
} from "@/lib/biometric";

type AuthContextValue = {
  isReady: boolean;
  session: AuthSession | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ needsActivation?: boolean; email?: string }>;
  signInWithBiometrics: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  enableBiometric: (email: string, session: { accessToken: string; refreshToken: string }) => Promise<void>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: () => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string; email: string }>;
  setPassword: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; message: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  setNewPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  updateUser: (updatedFields: Partial<AuthSession["user"]>) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Decode the exp field from a JWT without verifying signature */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((currentSession: AuthSession) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const exp = getTokenExpiry(currentSession.accessToken);
    if (!exp) return;

    // Refresh 2 minutes before expiry
    const msUntilRefresh =
      exp * 1000 - Date.now() - 2 * 60 * 1000;
    if (msUntilRefresh <= 0) {
      refreshSession(currentSession.refreshToken)
        .then(async (newSession) => {
          await saveSession(newSession);
          setSession(newSession);
          scheduleRefresh(newSession);
        })
        .catch(() => {
          clearSession().then(() => setSession(null));
        });
      return;
    }

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const newSession = await refreshSession(currentSession.refreshToken);
        await saveSession(newSession);
        setSession(newSession);
        scheduleRefresh(newSession);
      } catch {
        await clearSession();
        setSession(null);
      }
    }, msUntilRefresh);
  }, []);

  useEffect(() => {
    loadSession()
      .then((storedSession) => {
        console.log("Loaded session from storage:", storedSession);
        setSession(storedSession);
        if (storedSession) scheduleRefresh(storedSession);
      })
      .finally(() => {
        setIsReady(true);
      });

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,

      signIn: async (email, password) => {
        const result = await loginWithPassword(email, password);

        if (!result.ok) {
          if ("needsActivation" in result && result.needsActivation) {
            return { needsActivation: true, email: result.email };
          }
          if ("error" in result) {
            throw new Error(result.error);
          }
          throw new Error("Login failed");
        }

        console.log("Login result session:", result.session);
        await saveSession(result.session);
        setSession(result.session);
        scheduleRefresh(result.session);
        
        // Auto-store biometric session if biometric was previously enabled
        const wasBiometricEnabled = await isBiometricLoginEnabled();
        if (wasBiometricEnabled) {
          try {
            await storeBiometricSession({
              accessToken: result.session.accessToken,
              refreshToken: result.session.refreshToken,
            });
            console.log("Biometric session auto-stored after password login");
          } catch (e) {
            console.error("Failed to auto-store biometric session:", e);
          }
        }
        
        return {};
      },

      signInWithBiometrics: async () => {
        console.log("signInWithBiometrics - starting");
        // Check if biometrics is available
        const available = await isBiometricAvailable();
        console.log("signInWithBiometrics - available:", available);
        if (!available) {
          return { success: false, error: "Biometric authentication not available" };
        }

        // Check if biometric login is enabled
        const enabled = await isBiometricLoginEnabled();
        console.log("signInWithBiometrics - enabled:", enabled);
        if (!enabled) {
          return { success: false, error: "Biometric login not enabled" };
        }

        // Authenticate with biometrics
        const authResult = await authenticateWithBiometrics();
        console.log("signInWithBiometrics - auth result:", authResult);
        if (!authResult.success) {
          return {
            success: false,
            error: authResult.error,
            cancelled: authResult.cancelled,
          };
        }

        // Get stored session
        const storedSession = await getBiometricSession();
        console.log("signInWithBiometrics - stored session:", storedSession ? "exists" : "null");
        if (!storedSession) {
          return { success: false, error: "Authentication failed" };
        }

        // Verify the session is still valid by refreshing
        try {
          console.log("signInWithBiometrics - attempting to refresh with token:", storedSession.refreshToken ? "exists" : "null");
          const refreshedSession = await refreshSession(storedSession.refreshToken);
          console.log("signInWithBiometrics - refreshed session successfully");
          await saveSession(refreshedSession);
          setSession(refreshedSession);
          scheduleRefresh(refreshedSession);
          return { success: true };
        } catch (error) {
          console.log("signInWithBiometrics - refresh failed:", error);
          // Clear biometric session on refresh failure - user needs to re-enable
          await clearBiometricSession();
          return { success: false, error: "Authentication failed" };
        }
      },

      enableBiometric: async (email: string, sessionData: { accessToken: string; refreshToken: string }) => {
        await enableBiometricLoginWithVerification(email, sessionData);
      },

      disableBiometric: async () => {
        await disableBiometricLogin();
      },

      isBiometricEnabled: async () => {
        return isBiometricLoginEnabled();
      },

      verifyOtp: async (email: string, otp: string) => {
        return verifyOtpApi(email, otp);
      },

      setPassword: async (email: string, password: string) => {
        const nextSession = await setPasswordApi(email, password);
        await saveSession(nextSession);
        setSession(nextSession);
        scheduleRefresh(nextSession);
      },

      requestOtp: async (email) => {
        return requestOtpApi(email);
      },

      forgotPassword: async (email) => {
        return forgotPasswordApi(email);
      },

      verifyResetOtp: async (email: string, otp: string) => {
        return verifyResetOtpApi(email, otp);
      },

      setNewPassword: async (email: string, otp: string, newPassword: string) => {
        await setNewPasswordApi(email, otp, newPassword);
      },

      updateUser: (updatedFields: Partial<AuthSession["user"]>) => {
        setSession((current) => {
          if (!current) return current;
          return {
            ...current,
            user: { ...current.user, ...updatedFields },
          };
        });
      },

      signOut: async () => {
        const currentRefreshToken = session?.refreshToken;
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        await clearSession();
        // Clear biometric session on logout - user needs to re-enable after login
        await clearBiometricSession();
        setSession(null);
        // Best-effort server-side logout
        if (currentRefreshToken) {
          logoutApi(currentRefreshToken).catch(() => {});
        }
      },
    }),
    [isReady, session, scheduleRefresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}