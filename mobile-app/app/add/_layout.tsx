import { Stack } from "expo-router";

const HOME_BACK_TITLE = "Home";

export default function AddLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="index"
        options={{ title: "Add Book", headerBackTitle: HOME_BACK_TITLE }}
      />
      <Stack.Screen name="review" options={{ title: "Review book" }} />
      <Stack.Screen name="details" options={{ title: "Enter details" }} />
    </Stack>
  );
}
