import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { fetchBookById, removeBook, type Book } from "@/lib/books";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    fetchBookById(id).then((b) => {
      if (!cancelled) {
        setBook(b);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, user]);

  const handleDelete = () => {
    if (!book) return;
    Alert.alert("Delete book", "Remove this book from your library?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeBook(book.id);
            router.back();
          } catch {
            Alert.alert("Error", "Could not delete book.");
          }
        },
      },
    ]);
  };

  if (!user) return null;
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!book) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Book not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>
      <Text style={styles.isbn}>ISBN: {book.isbn}</Text>
      {book.publishDate ? (
        <Text style={styles.publishDate}>{book.publishDate}</Text>
      ) : null}
      {book.categories?.length ? (
        <Text style={styles.categories}>{book.categories.join(" · ")}</Text>
      ) : null}
      {book.averageRating != null && book.averageRating > 0 ? (
        <Text style={styles.rating}>
          ★ {book.averageRating.toFixed(1)}
          {book.ratingsCount != null && book.ratingsCount > 0
            ? ` (${book.ratingsCount} rating${book.ratingsCount === 1 ? "" : "s"})`
            : ""}
        </Text>
      ) : null}
      {book.language ? (
        <Text style={styles.language}>Language: {book.language}</Text>
      ) : null}
      <Text style={styles.meta}>
        {book.haveRead ? "Read" : "Unread"} · {book.own ? "Own" : "Don't own"}
      </Text>
      {book.description ? (
        <Text style={styles.description}>{book.description}</Text>
      ) : null}
      {book.commentary ? (
        <Text style={styles.commentary}>Notes: {book.commentary}</Text>
      ) : null}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete from library</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "#666" },
  title: { fontSize: 22, fontWeight: "bold" },
  author: { fontSize: 17, marginTop: 8, color: "#333" },
  isbn: { fontSize: 14, marginTop: 4, color: "#666" },
  publishDate: { fontSize: 14, marginTop: 4, color: "#666" },
  categories: { fontSize: 14, marginTop: 4, color: "#555" },
  rating: { fontSize: 14, marginTop: 4, color: "#666" },
  language: { fontSize: 14, marginTop: 4, color: "#666" },
  meta: { fontSize: 14, marginTop: 8, color: "#666" },
  description: { marginTop: 16, fontSize: 15, lineHeight: 22, color: "#444" },
  commentary: { marginTop: 12, fontSize: 15, fontStyle: "italic", color: "#444" },
  deleteButton: { marginTop: 24, padding: 14, backgroundColor: "#ffebee", borderRadius: 8 },
  deleteButtonText: { color: "#c62828", textAlign: "center", fontWeight: "600" },
});
