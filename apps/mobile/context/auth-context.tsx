import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  activateWithOtp,
  clearSession,
  loadSession,
  loginWithPassword,
  saveSession,
  type AuthSession,
} from "@/lib/auth";

type AuthContextValue = {
  isReady: boolean;
  session: AuthSession | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ needsActivation?: boolean; email?: string }>;
  activate: (email: string, otp: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadSession()
      .then((storedSession) => {
        setSession(storedSession);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      signIn: async (email, password) => {
        const result = await loginWithPassword(email, password);

        if (!result.ok) {
          if ('needsActivation' in result && result.needsActivation) {
            return { needsActivation: true, email: result.email };
          }

          if ('error' in result) {
            throw new Error(result.error);
          }

          throw new Error('Login failed');
        }

        await saveSession(result.session);
        setSession(result.session);
        return {};
      },
      activate: async (email, otp, password) => {
        const nextSession = await activateWithOtp(email, otp, password);
        await saveSession(nextSession);
        setSession(nextSession);
      },
      signOut: async () => {
        await clearSession();
        setSession(null);
      },
    }),
    [isReady, session],
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
