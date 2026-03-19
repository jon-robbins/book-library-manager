import { Stack } from "expo-router";

export default function AddLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Add Book" }} />
      <Stack.Screen name="review" options={{ title: "Review Book" }} />
      <Stack.Screen name="details" options={{ title: "Enter Details" }} />
    </Stack>
  );
}
