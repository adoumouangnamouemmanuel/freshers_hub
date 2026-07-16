import { Stack } from "expo-router";

export default function SupportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="coaching" options={{ title: "Peer Coaching" }} />
      <Stack.Screen name="counselling" options={{ title: "Counselling" }} />
      <Stack.Screen name="advising" options={{ title: "Academic Advising" }} />
      <Stack.Screen name="buddy-up" options={{ title: "Buddy Up (OIPCC)" }} />
    </Stack>
  );
}
