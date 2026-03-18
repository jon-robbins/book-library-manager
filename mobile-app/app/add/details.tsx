import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { addBook } from "@/lib/books";
import BookReviewForm, { buildAddBookPayload, type ReviewState } from "@/components/BookReviewForm";
import { LIBRARY_HOME } from "@/lib/routes";

const emptyState: ReviewState = {
  title: "",
  author: "",
  isbn: "",
  publishDate: "",
  description: "",
  categoriesStr: "",
  coverImgUrl: "",
  averageRating: null,
  ratingsCount: null,
  existingCount: 0,
  own: true,
  haveRead: false,
  commentary: "",
};

export default function AddDetailsScreen() {
  const router = useRouter();
  const [state, setState] = useState<ReviewState>(emptyState);

  const handleSubmit = useCallback(async () => {
    if (!state.title.trim() || !state.author.trim()) {
      Alert.alert("Required", "Please enter at least title and author.");
      return;
    }
    try {
      await addBook(buildAddBookPayload(state));
      Alert.alert("Added", `"${state.title}" added to your library.`, [
        { text: "OK", onPress: () => router.navigate(LIBRARY_HOME as Parameters<typeof router.navigate>[0]) },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not add book.";
      Alert.alert("Error", msg);
    }
  }, [state, router]);

  return (
    <BookReviewForm
      state={state}
      onUpdate={(key, value) => setState((prev) => ({ ...prev, [key]: value }))}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      submitLabel="Add to library"
    />
  );
}
