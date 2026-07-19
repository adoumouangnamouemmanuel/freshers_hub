import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { apiRequest } from "./api";

export type AuthRole = {
  name: string;
  unit_name: string | null;
};

export type StudentProfile = {
  schoolId: string;
  identifier: string;
  graduationYear: number;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  country?: string;
  major?: string;
  avatarUrl?: string;
  classYear?: number;
  createdAt?: string;
  roles: AuthRole[];
  studentProfile: StudentProfile | null;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginResult =
  | { ok: true; session: AuthSession }
  | { ok: false; needsActivation: true; email: string }
  | { ok: false; error: string };

const SESSION_KEY = "fresher-hub.session";

function getWebStorage() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

async function getItem(key: string) {
  const storage = getWebStorage();
  if (storage) return storage.getItem(key);
  return AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function removeItem(key: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export async function loadSession() {
  const value = await getItem(SESSION_KEY);
  if (!value) return null;
  return JSON.parse(value) as AuthSession;
}

export async function saveSession(session: AuthSession) {
  await setItem(SESSION_KEY, JSON.stringify(session));
}

// Store session for biometric login (called after successful password login)
export async function saveBiometricSession(session: AuthSession) {
  const { storeBiometricSession } = await import("./biometric");
  await storeBiometricSession({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });
}

export async function clearSession() {
  await removeItem(SESSION_KEY);
}

/* ─────────────── Auth API calls ─────────────── */

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const session = await apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return { ok: true, session };
  } catch (error) {
    const err = error as Error & {
      status?: number;
      body?: Record<string, unknown>;
      retryAfter?: number;
    };

    if (err.status === 409 && (err.body as any)?.needsActivation) {
      return { ok: false, needsActivation: true, email: (err.body as any)?.email || email };
    }

    // Re-throw lockout (423) and rate limit (429) errors for the frontend to handle
    if (err.status === 423 || err.status === 429) {
      const errorObj = new Error(err.message);
      (errorObj as any).status = err.status;
      (errorObj as any).retryAfter = err.retryAfter;
      throw errorObj;
    }

    return { ok: false, error: err.message };
  }
}

export async function verifyOtp(email: string, otp: string) {
  const result = await apiRequest<{ success: boolean; message: string; email: string }>(
    "/auth/verify-otp",
    { method: "POST", body: JSON.stringify({ email, otp }) },
  );
  return result;
}

export async function setPassword(email: string, password: string) {
  const session = await apiRequest<AuthSession>("/auth/set-password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return session;
}

export async function refreshSession(refreshToken: string) {
  const session = await apiRequest<AuthSession>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  return session;
}

export async function requestOtp(email: string) {
  const result = await apiRequest<{ success: boolean; message: string }>(
    "/auth/request-otp",
    { method: "POST", body: JSON.stringify({ email }) },
  );
  return result;
}

export async function forgotPassword(email: string) {
  const result = await apiRequest<{ success: boolean; message: string }>(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }) },
  );
  return result;
}

export async function verifyResetOtp(email: string, otp: string) {
  const result = await apiRequest<{ success: boolean; message: string }>(
    "/auth/verify-reset-otp",
    { method: "POST", body: JSON.stringify({ email, otp }) },
  );
  return result;
}

export async function setNewPassword(email: string, otp: string, newPassword: string) {
  const result = await apiRequest<{ success: boolean; message: string }>(
    "/auth/set-new-password",
    { method: "POST", body: JSON.stringify({ email, otp, newPassword }) },
  );
  return result;
}

export async function logout(refreshToken: string) {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Swallow — we clear local session regardless
  }
}