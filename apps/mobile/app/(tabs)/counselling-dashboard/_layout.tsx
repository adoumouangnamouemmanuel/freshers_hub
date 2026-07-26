import { Stack } from "expo-router";

export default function counsellingDashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cases" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="my-bookings" />
      <Stack.Screen name="peer-counsellors" />
    </Stack>
  );
}
