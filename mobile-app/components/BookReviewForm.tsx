import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { BookMetadata } from "@/lib/booksApi";
import { useAuth } from "@/components/AuthProvider";
import CropCoverModal from "@/components/CropCoverModal";

export type ReviewState = {
  title: string;
  author: string;
  isbn: string;
  publishDate: string;
  description: string;
  categoriesStr: string;
  coverImgUrl: string;
  averageRating: number | null;
  ratingsCount: number | null;
  existingCount: number;
  own: boolean;
  haveRead: boolean;
  commentary: string;
};

export function metaToReviewState(meta: BookMetadata, existingCount: number): ReviewState {
  return {
    title: meta.title,
    author: meta.author,
    isbn: meta.isbn,
    publishDate: meta.publishDate ?? "",
    description: meta.description ?? "",
    categoriesStr: (meta.categories?.length ? meta.categories : []).join(", "),
    coverImgUrl: meta.coverImgUrl ?? "",
    averageRating: meta.averageRating ?? null,
    ratingsCount: meta.ratingsCount ?? null,
    existingCount,
    own: true,
    haveRead: false,
    commentary: "",
  };
}

export function buildAddBookPayload(r: ReviewState) {
  const categories = r.categoriesStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: r.title.trim() || "Unknown Title",
    author: r.author.trim() || "Unknown Author",
    isbn: r.isbn.trim(),
    haveRead: r.haveRead,
    own: r.own,
    coverImgUrl: r.coverImgUrl.trim() || undefined,
    description: r.description.trim() || undefined,
    publishDate: r.publishDate.trim() || undefined,
    categories: categories.length ? categories : null,
    averageRating: r.averageRating ?? undefined,
    ratingsCount: r.ratingsCount ?? undefined,
    tags: null,
    commentary: (r.commentary ?? "").trim() || undefined,
  };
}

type Props = {
  state: ReviewState;
  onUpdate: <K extends keyof ReviewState>(key: K, value: ReviewState[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  /** When true, submit button is disabled and shows loading to prevent double submit */
  submitting?: boolean;
};

export default function BookReviewForm({
  state: r,
  onUpdate,
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
}: Props) {
  const { user } = useAuth();
  const [uploadingCover, setUploadingCover] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [pendingCoverUri, setPendingCoverUri] = useState<string | null>(null);
  const [lastPhotoSource, setLastPhotoSource] = useState<"camera" | "library">("camera");
  const update = <K extends keyof ReviewState>(key: K, value: ReviewState[K]) =>
    onUpdate(key, value);

  const openPicker = useCallback(
    async (source: "camera" | "library") => {
      if (!user) return;
      try {
        const isWeb = Platform.OS === "web";
        if (source === "camera" && !isWeb) {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Camera access",
              "Camera permission is needed to take a photo of the cover."
            );
            return;
          }
        }
        const result =
          source === "library" || isWeb
            ? await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 0.9,
              })
            : await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 0.9,
              });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        setLastPhotoSource(source);
        setPendingCoverUri(result.assets[0].uri);
        setCropModalVisible(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not open picker.";
        Alert.alert("Error", msg);
      }
    },
    [user]
  );

  const pickCoverPhoto = useCallback(() => {
    if (!user) return;
    if (Platform.OS === "web") {
      openPicker("library");
      return;
    }
    Alert.alert("Use my photo", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Take photo", onPress: () => openPicker("camera") },
      { text: "Choose from library", onPress: () => openPicker("library") },
    ]);
  }, [user, openPicker]);

  const handleCropRetake = useCallback(() => {
    setCropModalVisible(false);
    setPendingCoverUri(null);
    openPicker(lastPhotoSource);
  }, [lastPhotoSource, openPicker]);

  const handleCropDone = useCallback(
    (coverUrl: string) => {
      onUpdate("coverImgUrl", coverUrl);
      setCropModalVisible(false);
      setPendingCoverUri(null);
    },
    [onUpdate]
  );

  const handleCropCancel = useCallback(() => {
    setCropModalVisible(false);
    setPendingCoverUri(null);
  }, []);

  const label =
    submitLabel ?? (r.existingCount > 0 ? "Create new copy" : "Add to library");

  const showCropModal = cropModalVisible && !!pendingCoverUri && !!user;

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.reviewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.reviewTitle}>Review book</Text>
          <View style={styles.reviewCard}>
            <View style={styles.coverColumn}>
              {r.coverImgUrl ? (
                <Image source={{ uri: r.coverImgUrl }} style={styles.reviewCover} />
              ) : (
                <View style={[styles.reviewCover, styles.reviewCoverPlaceholder]}>
                  <Text style={styles.reviewCoverPlaceholderText}>No cover</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.coverLink}
                onPress={pickCoverPhoto}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Text style={styles.coverLinkText}>Use my photo</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.reviewMeta}>
            <Text style={styles.reviewFieldLabel}>Title</Text>
            <TextInput
              style={styles.reviewInput}
              value={r.title}
              onChangeText={(title) => update("title", title)}
              placeholder="Title"
              placeholderTextColor="#999"
            />
            <Text style={styles.reviewFieldLabel}>Author</Text>
            <TextInput
              style={styles.reviewInput}
              value={r.author}
              onChangeText={(author) => update("author", author)}
              placeholder="Author"
              placeholderTextColor="#999"
            />
            <Text style={styles.reviewFieldLabel}>Year / Publish date</Text>
            <TextInput
              style={styles.reviewInput}
              value={r.publishDate}
              onChangeText={(publishDate) => update("publishDate", publishDate)}
              placeholder="e.g. 2020 or 2020-01-15"
              placeholderTextColor="#999"
            />
            <Text style={styles.reviewFieldLabel}>
              Genres / Categories (comma-separated)
            </Text>
            <TextInput
              style={styles.reviewInput}
              value={r.categoriesStr}
              onChangeText={(categoriesStr) => update("categoriesStr", categoriesStr)}
              placeholder="e.g. Fiction, History"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        <Text style={styles.reviewFieldLabel}>Description</Text>
        <TextInput
          style={[styles.reviewInput, styles.reviewDescriptionInput]}
          value={r.description}
          onChangeText={(description) => update("description", description)}
          placeholder="Book description (optional)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>I own this book</Text>
          <Switch value={r.own} onValueChange={(own) => update("own", own)} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>I have read this</Text>
          <Switch
            value={r.haveRead}
            onValueChange={(haveRead) => update("haveRead", haveRead)}
          />
        </View>
        <Text style={styles.commentaryLabel}>Comments (optional)</Text>
        <TextInput
          style={styles.commentaryInput}
          placeholder="Add your notes about this book..."
          placeholderTextColor="#999"
          value={r.commentary}
          onChangeText={(commentary) => update("commentary", commentary)}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{label}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

      {user && (
        <CropCoverModal
          visible={showCropModal}
          imageUri={pendingCoverUri ?? ""}
          userId={user.uid}
          onDone={handleCropDone}
          onCancel={handleCropCancel}
          onRetake={handleCropRetake}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  reviewContent: { padding: 20, paddingTop: 24 },
  reviewTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  reviewCard: { flexDirection: "row", marginBottom: 20, gap: 16 },
  coverColumn: { alignItems: "center" },
  reviewCover: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  reviewCoverPlaceholder: { justifyContent: "center", alignItems: "center" },
  reviewCoverPlaceholderText: { color: "#888", fontSize: 12 },
  coverLink: { marginTop: 8, paddingVertical: 4, minHeight: 28, justifyContent: "center" },
  coverLinkText: { fontSize: 13, color: "#007AFF" },
  reviewMeta: { flex: 1, justifyContent: "center" },
  reviewFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
    marginBottom: 4,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    fontSize: 15,
    backgroundColor: "#fff",
    color: "#111",
  },
  reviewDescriptionInput: { minHeight: 72, textAlignVertical: "top" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  toggleLabel: { fontSize: 16 },
  commentaryLabel: { fontSize: 16, marginTop: 16, marginBottom: 8 },
  commentaryInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 88,
    textAlignVertical: "top",
    color: "#111",
  },
  secondaryButton: { marginTop: 12, alignItems: "center", paddingVertical: 14 },
  secondaryButtonText: { color: "#007AFF", fontSize: 16 },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
