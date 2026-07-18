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

type AuthContextValue = {
  isReady: boolean;
  session: AuthSession | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ needsActivation?: boolean; email?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string; email: string }>;
  setPassword: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; message: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  setNewPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
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

        await saveSession(result.session);
        setSession(result.session);
        scheduleRefresh(result.session);
        return {};
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

      signOut: async () => {
        const currentRefreshToken = session?.refreshToken;
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        await clearSession();
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