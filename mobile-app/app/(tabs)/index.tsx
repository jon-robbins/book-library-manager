import { useEffect, useState, useCallback } from "react";
import { Redirect, useRouter, useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl, Image } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyBooks, type Book } from "@/lib/books";

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadBooks = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const list = await fetchMyBooks();
      setBooks(list);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load books.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadBooks();
  }, [user, loadBooks]);

  useFocusEffect(
    useCallback(() => {
      if (user) loadBooks();
    }, [user, loadBooks])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading && books.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && books.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadBooks(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No books yet. Scan a barcode to add one.</Text>
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
              <TouchableOpacity onPress={() => { setError(null); onRefresh(); }}>
                <Text style={styles.retryLink}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/book/${item.id}`)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Book: ${item.title} by ${item.author}`}
          >
            {item.coverImgUrl ? (
              <Image
                source={{ uri: item.coverImgUrl }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={styles.coverPlaceholderText}>📖</Text>
              </View>
            )}
            <View style={styles.rowText}>
              <Text style={styles.bookTitle} numberOfLines={2} ellipsizeMode="tail">
                {item.title}
              </Text>
              <Text style={styles.bookAuthor} numberOfLines={1} ellipsizeMode="tail">
                {item.author}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { padding: 20, textAlign: "center", color: "#666" },
  errorText: { color: "#666", textAlign: "center", paddingHorizontal: 24, marginBottom: 16 },
  retryButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: "#007AFF", borderRadius: 8 },
  retryButtonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
  },
  errorBannerText: { flex: 1, color: "#856404", fontSize: 14, marginRight: 12 },
  retryLink: { color: "#007AFF", fontSize: 14, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cover: {
    width: 44,
    height: 66,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  coverPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  coverPlaceholderText: { fontSize: 22 },
  rowText: { flex: 1, marginLeft: 14 },
  bookTitle: { fontSize: 17, fontWeight: "600" },
  bookAuthor: { fontSize: 14, color: "#666", marginTop: 4 },
});
