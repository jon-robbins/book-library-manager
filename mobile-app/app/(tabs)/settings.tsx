import { Redirect } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsScreen() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  button: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  buttonText: { fontSize: 16 },
});
