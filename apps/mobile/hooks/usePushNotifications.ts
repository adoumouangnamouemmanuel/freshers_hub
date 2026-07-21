/**
 * usePushNotifications
 *
 * Opt-in push notification hook.
 * Call `enablePush()` to request permission, obtain the Expo push token,
 * and register it with the backend.
 * Call `disablePush()` to deregister.
 *
 * NOTE: expo-notifications is NOT yet in package.json.
 * Until it is installed, the hook gracefully degrades (no-ops).
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/lib/api";

const STORAGE_KEY = "@push_opt_in";
const STORAGE_TOKEN = "@push_token";

let Notifications: any = null;
try {
  // Dynamic require so the app doesn't crash if the package isn't installed yet
  Notifications = require("expo-notifications");
} catch {
  Notifications = null;
}

async function registerToken(accessToken: string, pushToken: string) {
  await fetch(`${API_URL}/notifications/push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ pushToken }),
  });
}

async function deregisterToken(accessToken: string, pushToken: string) {
  await fetch(`${API_URL}/notifications/push-token`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ pushToken }),
  });
}

export function usePushNotifications(accessToken: string | undefined) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => setIsEnabled(v === "true"));
  }, []);

  const enablePush = useCallback(async () => {
    if (!accessToken) return;
    if (!Notifications) {
      console.warn("[Push] expo-notifications not installed yet.");
      return;
    }
    setIsLoading(true);
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        setIsLoading(false);
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await AsyncStorage.setItem(STORAGE_KEY, "true");
      await AsyncStorage.setItem(STORAGE_TOKEN, token);
      await registerToken(accessToken, token);
      setIsEnabled(true);

      // Configure notification channel on Android
      if (Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#A93C40",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const disablePush = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_TOKEN);
      if (token) await deregisterToken(accessToken, token);
      await AsyncStorage.setItem(STORAGE_KEY, "false");
      await AsyncStorage.removeItem(STORAGE_TOKEN);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return { isEnabled, isLoading, enablePush, disablePush };
}
