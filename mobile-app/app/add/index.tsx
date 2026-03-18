import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { getBookMetadataByIsbn } from "@/lib/booksApi";
import { fetchBooksByIsbn } from "@/lib/books";

export default function AddBookByIsbnScreen() {
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = useCallback(async () => {
    const digits = isbn.replace(/\D/g, "");
    if (digits.length < 10) {
      Alert.alert("Invalid ISBN", "Enter at least 10 digits.");
      return;
    }
    setLoading(true);
    try {
      const meta = await getBookMetadataByIsbn(digits);
      if (!meta) {
        Alert.alert("Not found", "No book metadata found for this ISBN.");
        return;
      }
      const existing = await fetchBooksByIsbn(meta.isbn);
      router.push({ pathname: "/add/review", params: { isbn: meta.isbn } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not look up book.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [isbn, router]);

  const openManualDetails = () => {
    router.push("/add/details");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.label}>ISBN</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 9780140328721"
          placeholderTextColor="#999"
          value={isbn}
          onChangeText={setIsbn}
          keyboardType="number-pad"
          maxLength={17}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkWrap} onPress={openManualDetails}>
          <Text style={styles.link}>Enter details manually</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginBottom: 8, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: "#111",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonDisabled: { opacity: 0.7 },
  linkWrap: { marginTop: 20, alignItems: "center" },
  link: { fontSize: 14, color: "#007AFF" },
});
