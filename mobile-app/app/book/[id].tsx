import { useEffect, useLayoutEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput, ScrollView } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { fetchBookById, removeBook, editBook, addToWantToRead, removeFromWantToRead, type Book } from "@/lib/books";
import BookCoverImage from "@/components/BookCoverImage";
import ErrorState from "@/components/ErrorState";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingCommentary, setEditingCommentary] = useState("");
  const [savingCommentary, setSavingCommentary] = useState(false);
  const [commentaryError, setCommentaryError] = useState<string | null>(null);
  const [updatingWantToRead, setUpdatingWantToRead] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: book?.title ?? "Book" });
  }, [navigation, book?.title]);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    fetchBookById(id)
      .then((b) => {
        if (!cancelled) {
          setBook(b);
          setEditingCommentary(b?.commentary ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) setBook(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, user]);

  const handleEditCommentary = () => {
    setEditMode(true);
    setCommentaryError(null);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingCommentary(book?.commentary ?? "");
    setCommentaryError(null);
  };

  const handleSaveCommentary = async () => {
    if (!book || !id) return;

    setSavingCommentary(true);
    setCommentaryError(null);

    try {
      await editBook({
        id,
        commentary: editingCommentary || null,
      });
      setBook({ ...book, commentary: editingCommentary || undefined });
      setEditMode(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save commentary";
      setCommentaryError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setSavingCommentary(false);
    }
  };

  const handleToggleWantToRead = async () => {
    if (!book) return;
    setUpdatingWantToRead(true);
    try {
      if (book.wantToRead) {
        await removeFromWantToRead(book.id);
        setBook({ ...book, wantToRead: false });
      } else {
        await addToWantToRead(book.id);
        setBook({ ...book, wantToRead: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update";
      Alert.alert("Error", errorMessage);
    } finally {
      setUpdatingWantToRead(false);
    }
  };

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
      <View style={styles.centered} testID="centered">
        <ActivityIndicator size="large" testID="loading-indicator" />
      </View>
    );
  }
  if (!book) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Book not found"
          message="The book you're looking for could not be loaded. It may have been deleted or there was a problem retrieving it."
          onRetry={() => router.back()}
          testID="error-state"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <BookCoverImage
        book={book}
        style={styles.cover}
        resizeMode="cover"
        placeholderStyle={styles.coverPlaceholder}
        placeholderText="📖"
      />
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

      {/* Commentary Section */}
      <View style={styles.commentarySection} testID="commentary-section">
        {editMode ? (
          <View>
            <Text style={styles.commentaryLabel}>Notes</Text>
            <TextInput
              style={[styles.commentaryInput, commentaryError && styles.commentaryInputError]}
              value={editingCommentary}
              onChangeText={setEditingCommentary}
              placeholder="Add notes about this book..."
              multiline
              numberOfLines={4}
              editable={!savingCommentary}
              testID="commentary-input"
            />
            {commentaryError ? (
              <Text style={styles.errorText} testID="commentary-error">
                {commentaryError}
              </Text>
            ) : null}
            <View style={styles.commentaryButtonRow}>
              <TouchableOpacity
                style={[styles.commentaryButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={savingCommentary}
                testID="cancel-button"
              >
                {!savingCommentary && <Text style={styles.cancelButtonText}>Cancel</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.commentaryButton, styles.saveButton, savingCommentary && styles.saveButtonDisabled]}
                onPress={handleSaveCommentary}
                disabled={savingCommentary}
                testID="save-button"
              >
                <Text style={styles.saveButtonText}>
                  {savingCommentary ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            {book.commentary ? (
              <>
                <Text style={styles.commentaryLabel}>Notes</Text>
                <Text style={styles.commentary}>{book.commentary}</Text>
              </>
            ) : (
              <Text style={styles.noCommentary}>No notes yet</Text>
            )}
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditCommentary}
              testID="edit-button"
            >
              <Text style={styles.editButtonText}>{book.commentary ? "Edit Notes" : "Add Notes"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.wantToReadButton, book.wantToRead && styles.wantToReadButtonActive]}
        onPress={handleToggleWantToRead}
        disabled={updatingWantToRead}
        testID="want-to-read-button"
      >
        <Text style={[styles.wantToReadButtonText, book.wantToRead && styles.wantToReadButtonTextActive]}>
          {updatingWantToRead ? "Updating..." : book.wantToRead ? "✓ In Want-to-Read List" : "Add to Want-to-Read"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} testID="delete-button">
        <Text style={styles.deleteButtonText}>Delete from library</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  cover: {
    width: "100%",
    maxWidth: 200,
    height: 300,
    alignSelf: "center",
    borderRadius: 8,
    backgroundColor: "#eee",
    marginBottom: 16,
  },
  coverPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  coverPlaceholderText: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: "bold" },
  author: { fontSize: 17, marginTop: 8, color: "#333" },
  isbn: { fontSize: 14, marginTop: 4, color: "#666" },
  publishDate: { fontSize: 14, marginTop: 4, color: "#666" },
  categories: { fontSize: 14, marginTop: 4, color: "#555" },
  rating: { fontSize: 14, marginTop: 4, color: "#666" },
  language: { fontSize: 14, marginTop: 4, color: "#666" },
  meta: { fontSize: 14, marginTop: 8, color: "#666" },
  description: { marginTop: 16, fontSize: 15, lineHeight: 22, color: "#444" },
  commentarySection: { marginTop: 20, paddingBottom: 10 },
  commentaryLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#333" },
  commentary: { fontSize: 15, lineHeight: 22, color: "#444", fontStyle: "italic" },
  noCommentary: { fontSize: 14, color: "#999", fontStyle: "italic", marginBottom: 12 },
  commentaryInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
    minHeight: 100,
  },
  commentaryInputError: {
    borderColor: "#c62828",
    backgroundColor: "#ffebee",
  },
  errorText: {
    color: "#c62828",
    fontSize: 13,
    marginBottom: 10,
  },
  commentaryButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  commentaryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#2196F3",
  },
  saveButtonDisabled: {
    backgroundColor: "#90caf9",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  editButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#1976d2",
    fontWeight: "600",
    fontSize: 14,
  },
  wantToReadButton: { marginTop: 24, padding: 14, backgroundColor: "#e3f2fd", borderRadius: 8 },
  wantToReadButtonActive: { backgroundColor: "#c8e6c9" },
  wantToReadButtonText: { color: "#1976d2", textAlign: "center", fontWeight: "600" },
  wantToReadButtonTextActive: { color: "#2e7d32" },
  deleteButton: { marginTop: 12, padding: 14, backgroundColor: "#ffebee", borderRadius: 8 },
  deleteButtonText: { color: "#c62828", textAlign: "center", fontWeight: "600" },
});
