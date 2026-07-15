import { Stack } from "expo-router";

export default function CoachingAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="peer-coaches" />
      <Stack.Screen name="freshers" />
      <Stack.Screen name="assignments" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="compliance" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="my-bookings" />
    </Stack>
  );
}
