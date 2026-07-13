import * as SecureStore from "expo-secure-store";
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
  if (storage) {
    return storage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function loadSession() {
  const value = await getItem(SESSION_KEY);
  if (!value) {
    return null;
  }

  return JSON.parse(value) as AuthSession;
}

export async function saveSession(session: AuthSession) {
  await setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await removeItem(SESSION_KEY);
}

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
    const status = (error as Error & { status?: number }).status;
    const body = (
      error as Error & { body?: { needsActivation?: boolean; email?: string } }
    ).body;

    if (status === 409 && body?.needsActivation) {
      return { ok: false, needsActivation: true, email: body.email || email };
    }

    return { ok: false, error: (error as Error).message };
  }
}

export async function activateWithOtp(
  email: string,
  otp: string,
  password: string,
) {
  const session = await apiRequest<AuthSession>("/auth/activate", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
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
