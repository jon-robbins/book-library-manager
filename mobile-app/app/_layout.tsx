import { Stack } from "expo-router";
import { AuthProvider } from "@/components/AuthProvider";
import "../global.css";

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
            headerBackTitle: "Home",
          }}
        />
        <Stack.Screen
          name="book/[id]"
          options={{ headerShown: true, title: "Book", headerBackTitle: "Home" }}
        />
        <Stack.Screen name="add" options={{ headerBackTitle: "Home" }} />
      </Stack>
    </AuthProvider>
  );
}
