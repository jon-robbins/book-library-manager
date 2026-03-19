import { Stack } from "expo-router";
import { AuthProvider } from "@/components/AuthProvider";
import "../global.css";

const HOME_BACK_TITLE = "Home";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
        <Stack.Screen
          name="scan"
          options={{
            headerShown: true,
            title: "Scan Barcode",
            presentation: "modal",
            headerBackTitle: HOME_BACK_TITLE,
          }}
        />
        <Stack.Screen
          name="book/[id]"
          options={{ headerShown: true, title: "Book", headerBackTitle: HOME_BACK_TITLE }}
        />
        <Stack.Screen name="add" />
      </Stack>
    </AuthProvider>
  );
}
