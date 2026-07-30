import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/context/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function AppNavigator() {
  const { isReady, session } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    // If we have a session and we're in the auth group (login screen), redirect to home
    if (session && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }

    // If we don't have a session and we're not in the auth group, redirect to login
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [isReady, router, segments, session]);

  // Handle push notification registration once a session is active
  const { enablePush } = usePushNotifications(session?.accessToken);
  useEffect(() => {
    if (isReady && session?.accessToken) {
      enablePush();
    }
  }, [isReady, session?.accessToken, enablePush]);

  // Show loading screen while checking session
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#6B1D2A" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="new-post" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="profile" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="search" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="edit-post/[id]" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="change-password" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persistOptions } from '@/lib/queryClient';

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <BottomSheetModalProvider>
              <AuthProvider>
                <AppNavigator />
              </AuthProvider>
            </BottomSheetModalProvider>
          </PersistQueryClientProvider>
          <StatusBar style="dark" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}