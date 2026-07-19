import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import React from "react";

// App lock timeout options in milliseconds
export const APP_LOCK_TIMEOUTS = {
  immediate: 0,
  "1min": 1 * 60 * 1000,
  "2min": 2 * 60 * 1000,
  "5min": 5 * 60 * 1000,
  "10min": 10 * 60 * 1000,
  "15min": 15 * 60 * 1000,
} as const;

export type AppLockTimeout = keyof typeof APP_LOCK_TIMEOUTS;

const APP_LOCK_TIMEOUT_KEY = "fresher-hub.app-lock-timeout";
const APP_LOCK_TIMESTAMP_KEY = "fresher-hub.app-lock-timestamp";

// Get the current app lock timeout setting
export async function getAppLockTimeout(): Promise<AppLockTimeout> {
  try {
    const value = await AsyncStorage.getItem(APP_LOCK_TIMEOUT_KEY);
    if (value && value in APP_LOCK_TIMEOUTS) {
      return value as AppLockTimeout;
    }
    return "immediate"; // Default to immediate lock
  } catch (error) {
    console.error("Error getting app lock timeout:", error);
    return "immediate";
  }
}

// Set the app lock timeout
export async function setAppLockTimeout(timeout: AppLockTimeout): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_LOCK_TIMEOUT_KEY, timeout);
  } catch (error) {
    console.error("Error setting app lock timeout:", error);
  }
}

// Check if the app is currently locked (requires re-authentication)
export async function isAppLocked(): Promise<boolean> {
  try {
    const timeout = await getAppLockTimeout();
    const timeoutMs = APP_LOCK_TIMEOUTS[timeout];
    
    // If immediate lock, always require authentication
    if (timeoutMs === 0) {
      return true;
    }
    
    // Get the last lock timestamp
    const timestamp = await AsyncStorage.getItem(APP_LOCK_TIMESTAMP_KEY);
    if (!timestamp) {
      return true; // No timestamp, require authentication
    }
    
    const lastLock = parseInt(timestamp, 10);
    const now = Date.now();
    
    // Check if the timeout has expired
    return now - lastLock > timeoutMs;
  } catch (error) {
    console.error("Error checking app lock status:", error);
    return true;
  }
}

// Update the lock timestamp (call when app goes to background)
export async function updateAppLockTimestamp(): Promise<void> {
  try {
    await AsyncStorage.setItem(APP_LOCK_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error updating app lock timestamp:", error);
  }
}

// Clear the lock timestamp (call on successful login)
export async function clearAppLockTimestamp(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_LOCK_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Error clearing app lock timestamp:", error);
  }
}

// Hook to manage app lock state
export function useAppLockState() {
  const [isLocked, setIsLocked] = React.useState(true);
  
  React.useEffect(() => {
    const checkLock = async () => {
      const locked = await isAppLocked();
      setIsLocked(locked);
    };
    
    checkLock();
    
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        updateAppLockTimestamp();
      } else if (nextAppState === "active") {
        checkLock();
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  return isLocked;
}