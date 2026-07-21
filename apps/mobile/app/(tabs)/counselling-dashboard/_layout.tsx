import { Stack } from "expo-router";

export default function counsellingDashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="my-bookings" />
    </Stack>
  );
}
