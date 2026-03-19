import { useEffect, useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useAuth } from "@/components/AuthProvider";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
});

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signInWithGoogle, error, clearError } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    clearError?.();
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch {
      // error state is set in AuthProvider
    }
  };

  const handleGoogleSignIn = async () => {
    clearError?.();
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (__DEV__) {
        console.log("[GoogleAuth] signIn result", {
          type: response.type,
          hasIdToken: Boolean(response.data?.idToken),
        });
      }

      if (response.type === "cancelled") return;

      const idToken = response.data?.idToken;
      if (!idToken) {
        Alert.alert("Error", "Google sign in did not return an ID token.");
        return;
      }

      await signInWithGoogle({ idToken });
      router.replace("/(tabs)");
    } catch (err: unknown) {
      if (__DEV__) console.log("[GoogleAuth] Error", err);

      if (err instanceof Error && "code" in err) {
        const code = (err as { code: string }).code;
        if (code === statusCodes.SIGN_IN_CANCELLED) return;
        if (code === statusCodes.IN_PROGRESS) return;
        if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert("Error", "Google Play Services is not available.");
          return;
        }
      }
      const message = err instanceof Error ? err.message : "Google sign in failed";
      Alert.alert("Error", message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Log in</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.line} />
        </View>
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  form: { gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  error: { color: "red", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, fontSize: 16, color: "#111" },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 8, alignItems: "center" },
  googleButton: { backgroundColor: "#4285F4" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: "#ddd" },
  dividerText: { marginHorizontal: 8, color: "#666" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { alignItems: "center", marginTop: 16 },
  linkText: { color: "#007AFF" },
});
