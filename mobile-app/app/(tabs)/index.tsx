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
  const router = useRouter();

  const loadBooks = useCallback(async () => {
    if (!user) return;
    try {
      const list = await fetchMyBooks();
      setBooks(list);
    } catch {
      // ignore
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/book/${item.id}`)}
            activeOpacity={0.7}
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
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookAuthor}>{item.author}</Text>
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
