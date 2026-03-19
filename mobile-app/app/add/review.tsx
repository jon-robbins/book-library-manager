import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { getBookMetadataByIsbn } from "@/lib/booksApi";
import { fetchBooksByIsbn, addBook } from "@/lib/books";
import BookReviewForm, {
  metaToReviewState,
  buildAddBookPayload,
  type ReviewState,
} from "@/components/BookReviewForm";
import ErrorState from "@/components/ErrorState";
import { LIBRARY_HOME } from "@/lib/routes";

export default function AddReviewScreen() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const router = useRouter();
  const [state, setState] = useState<ReviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isbn || isbn.length < 10) {
      setError("Invalid ISBN");
      setLoading(false);
      return;
    }
    let cancelled = false;
    getBookMetadataByIsbn(isbn)
      .then((meta) => {
        if (cancelled) return;
        if (!meta) {
          setError("No book metadata found for this ISBN.");
          return;
        }
        return fetchBooksByIsbn(meta.isbn).then((existing) => ({
          meta,
          existingCount: existing.length,
        }));
      })
      .then((payload) => {
        if (cancelled || !payload) return;
        setState(metaToReviewState(payload.meta, payload.existingCount));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lookup failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isbn]);

  const handleSubmit = useCallback(async () => {
    if (!state) return;
    try {
      await addBook(buildAddBookPayload(state));
      Alert.alert(
        "Added",
        state.existingCount > 0
          ? `"${state.title}" added as a new copy.`
          : `"${state.title}" added to your library.`,
        [{ text: "OK", onPress: () => router.navigate(LIBRARY_HOME as Parameters<typeof router.navigate>[0]) }]
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not add book.";
      Alert.alert("Error", msg);
    }
  }, [state, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Looking up book...</Text>
      </View>
    );
  }

  if (error || !state) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Unable to look up book"
          message={error ?? "Could not retrieve book information. Please check the ISBN and try again."}
          onRetry={() => router.back()}
          testID="error-state"
        />
      </View>
    );
  }

  return (
    <BookReviewForm
      state={state}
      onUpdate={(key, value) => setState((prev) => (prev ? { ...prev, [key]: value } : null))}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  message: { textAlign: "center", color: "#666" },
});
