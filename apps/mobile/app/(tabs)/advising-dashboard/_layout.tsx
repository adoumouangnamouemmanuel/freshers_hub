import { Stack } from "expo-router";

export default function AdvisingDashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="my-bookings" />
    </Stack>
  );
}
