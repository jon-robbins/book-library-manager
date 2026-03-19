import { useEffect, useState, useCallback, useRef } from "react";
import { Redirect, useRouter, useFocusEffect } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyBooks, type Book } from "@/lib/books";
import BookCoverImage from "@/components/BookCoverImage";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const loadBooksRef = useRef<(() => Promise<void>) | null>(null);

  const loadBooks = useCallback(async () => {
    if (!user) return;
    try {
      const list = await fetchMyBooks();
      setBooks(list);
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load books";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  loadBooksRef.current = loadBooks;

  useEffect(() => {
    if (user) {
      loadBooks();
    }
  }, [user, loadBooks]);

  useFocusEffect(
    useCallback(() => {
      if (user && loadBooksRef.current) {
        loadBooksRef.current();
      }
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBooks();
  }, [loadBooks]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    loadBooks();
  }, [loadBooks]);

  const handleRetryError = useCallback(() => {
    setError(null);
    setRefreshing(true);
    loadBooks();
  }, [loadBooks]);

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" testID="auth-loading" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading && books.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" testID="initial-loading" />
      </View>
    );
  }

  if (error && books.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Unable to load library"
          message={error}
          onRetry={handleRetry}
          testID="error-state"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && books.length > 0 && (
        <ErrorBanner
          message={error}
          onRetry={handleRetryError}
          onDismiss={() => setError(null)}
          testID="error-banner"
        />
      )}
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            title="Pull to refresh"
            titleColor="#666"
            testID="refresh-control"
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No books yet"
            subtitle="Scan a barcode or manually add a book to get started"
            icon="📚"
            testID="empty-state"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/book/${item.id}`)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Book: ${item.title} by ${item.author}`}
            testID={`book-row-${item.id}`}
          >
            <BookCoverImage
              book={item}
              style={styles.cover}
              resizeMode="cover"
              placeholderStyle={styles.coverPlaceholder}
              placeholderText="📖"
            />
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
        contentContainerStyle={books.length === 0 ? styles.emptyListContent : undefined}
        testID="books-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  emptyListContent: { flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cover: {
    width: 48,
    height: 72,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  coverPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  coverPlaceholderText: { fontSize: 24 },
  rowText: { flex: 1, marginLeft: 14 },
  bookTitle: { fontSize: 16, fontWeight: "600", color: "#333", lineHeight: 20 },
  bookAuthor: { fontSize: 13, color: "#999", marginTop: 4 },
});
