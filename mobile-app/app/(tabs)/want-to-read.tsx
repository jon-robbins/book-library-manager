import { useEffect, useState, useCallback, useRef } from "react";
import { Redirect, useRouter, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "@/components/AuthProvider";
import {
  getWantToReadList,
  removeFromWantToRead,
  moveWantToReadPosition,
  type Book,
} from "@/lib/books";
import BookCoverImage from "@/components/BookCoverImage";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";

export default function WantToReadScreen() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const loadBooksRef = useRef<(() => Promise<void>) | null>(null);

  const loadBooks = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getWantToReadList();
      setBooks(list);
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load want-to-read list";
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

  const handleRemoveBook = useCallback(
    (bookId: string, bookTitle: string) => {
      Alert.alert("Remove from list", `Remove "${bookTitle}" from your want-to-read list?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromWantToRead(bookId);
              setBooks((prev) => prev.filter((b) => b.id !== bookId));
            } catch (e) {
              const message = e instanceof Error ? e.message : "Failed to remove book";
              Alert.alert("Error", message);
            }
          },
        },
      ]);
    },
    []
  );

  const handleMoveBook = useCallback(
    async (bookId: string, direction: "up" | "down") => {
      const currentIndex = books.findIndex((b) => b.id === bookId);
      if (currentIndex === -1) return;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= books.length) return;

      try {
        await moveWantToReadPosition(bookId, newIndex);
        const newBooks = [...books];
        [newBooks[currentIndex], newBooks[newIndex]] = [newBooks[newIndex], newBooks[currentIndex]];
        setBooks(newBooks);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to reorder books";
        Alert.alert("Error", message);
      }
    },
    [books]
  );

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
          title="Unable to load list"
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
      {editMode && books.length > 0 && (
        <View style={styles.editModeBanner}>
          <Text style={styles.editModeText}>Tap arrow buttons to reorder • Tap × to remove</Text>
          <TouchableOpacity onPress={() => setEditMode(false)}>
            <Text style={styles.editModeDone}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
      {books.length > 0 && !editMode && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(true)}
          testID="edit-button"
        >
          <Text style={styles.editButtonText}>Reorder</Text>
        </TouchableOpacity>
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
            title="No books to read"
            subtitle="Add books to your want-to-read list from your library"
            icon="📖"
            testID="empty-state"
          />
        }
        renderItem={({ item, index }) => (
          <View style={styles.rowContainer}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => !editMode && router.push(`/book/${item.id}`)}
              activeOpacity={editMode ? 1 : 0.7}
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
            {editMode && (
              <View style={styles.editControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleMoveBook(item.id, "up")}
                  disabled={index === 0}
                  testID={`move-up-${item.id}`}
                >
                  <Text style={[styles.controlButtonText, index === 0 && styles.disabledText]}>
                    ↑
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleMoveBook(item.id, "down")}
                  disabled={index === books.length - 1}
                  testID={`move-down-${item.id}`}
                >
                  <Text style={[styles.controlButtonText, index === books.length - 1 && styles.disabledText]}>
                    ↓
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.removeButton]}
                  onPress={() => handleRemoveBook(item.id, item.title)}
                  testID={`remove-${item.id}`}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={books.length === 0 ? styles.emptyListContent : undefined}
        testID="want-to-read-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  emptyListContent: { flexGrow: 1 },
  editButton: {
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#1976d2",
    fontWeight: "600",
    fontSize: 14,
  },
  editModeBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff3e0",
    borderBottomWidth: 1,
    borderBottomColor: "#ffe0b2",
  },
  editModeText: {
    fontSize: 13,
    color: "#e65100",
    fontWeight: "500",
  },
  editModeDone: {
    color: "#1976d2",
    fontWeight: "600",
    fontSize: 14,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
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
  rowText: { flex: 1, marginLeft: 14 },
  bookTitle: { fontSize: 16, fontWeight: "600", color: "#333", lineHeight: 20 },
  bookAuthor: { fontSize: 13, color: "#999", marginTop: 4 },
  editControls: {
    flexDirection: "row",
    paddingRight: 12,
    gap: 4,
  },
  controlButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    fontSize: 16,
    color: "#1976d2",
    fontWeight: "600",
  },
  disabledText: {
    color: "#ccc",
  },
  removeButton: {
    backgroundColor: "#ffebee",
  },
  removeButtonText: {
    fontSize: 18,
    color: "#c62828",
    fontWeight: "600",
  },
});
