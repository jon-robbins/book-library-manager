import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
  Image,
} from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BookMetadata } from "@/lib/booksApi";
import { getBookMetadataByIsbn } from "@/lib/booksApi";
import { fetchBooksByIsbn, addBook } from "@/lib/books";

type Props = {
  /** Called when a book was added (e.g. router.back when shown as a stack screen). */
  onAdded?: () => void;
};

/** Review step: show metadata and let user set own/haveRead and commentary before adding. */
type ReviewState = {
  meta: BookMetadata;
  existingCount: number;
  own: boolean;
  haveRead: boolean;
  commentary: string;
};

function buildAddBookPayload(
  meta: BookMetadata,
  own: boolean,
  haveRead: boolean,
  commentary: string
) {
  return {
    title: meta.title,
    author: meta.author,
    isbn: meta.isbn,
    haveRead,
    own,
    coverImgUrl: meta.coverImgUrl || undefined,
    description: meta.description || undefined,
    publishDate: meta.publishDate || undefined,
    categories: meta.categories?.length ? meta.categories : null,
    averageRating: meta.averageRating ?? undefined,
    ratingsCount: meta.ratingsCount ?? undefined,
    // Omit language: deployed DataConnect connector may not accept $language
    tags: null,
    commentary: (commentary ?? "").trim() || undefined,
  };
}

export default function ScanScreenContent({ onAdded }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualIsbn, setManualIsbn] = useState("");
  const [review, setReview] = useState<ReviewState | null>(null);
  const { user } = useAuth();
  const processingRef = useRef(false);

  const onLookupDone = useCallback(() => {
    setScanned(false);
    setLoading(false);
    processingRef.current = false;
  }, []);

  const showReview = useCallback((meta: BookMetadata, existingCount: number) => {
    setReview({
      meta,
      existingCount,
      own: true,
      haveRead: false,
      commentary: "",
    });
    onLookupDone();
  }, [onLookupDone]);

  const dismissReview = useCallback(() => {
    setReview(null);
  }, []);

  const submitFromReview = useCallback(
    async (r: ReviewState) => {
      try {
        await addBook(buildAddBookPayload(r.meta, r.own, r.haveRead, r.commentary));
        Alert.alert(
          "Added",
          r.existingCount > 0
            ? `"${r.meta.title}" added as a new copy.`
            : `"${r.meta.title}" added to your library.`,
          [{ text: "OK", onPress: () => { setReview(null); onAdded?.(); } }]
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not add book.";
        Alert.alert("Error", msg);
      }
    },
    [onAdded]
  );

  const handleBarCodeScanned = useCallback(
    (result: { data: string }) => {
      if (processingRef.current || !user) return;
      const digits = (result.data || "").replace(/\D/g, "");
      if (digits.length < 10) return;
      processingRef.current = true;
      setScanned(true);
      setLoading(true);
      getBookMetadataByIsbn(digits)
        .then((meta) => {
          if (!meta) {
            Alert.alert("Not found", "No book metadata found for this ISBN.");
            onLookupDone();
            return;
          }
          return fetchBooksByIsbn(meta.isbn).then((existing) => ({ meta, existing }));
        })
        .then((payload) => {
          if (!payload) return;
          showReview(payload.meta, payload.existing.length);
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "Could not look up book.";
          Alert.alert("Error", msg);
        })
        .finally(onLookupDone);
    },
    [user, onLookupDone, showReview]
  );

  const handleManualSubmit = useCallback(async () => {
    const digits = manualIsbn.replace(/\D/g, "");
    if (digits.length < 10) {
      Alert.alert("Invalid ISBN", "Enter at least 10 digits.");
      return;
    }
    if (processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    try {
      const meta = await getBookMetadataByIsbn(digits);
      if (!meta) {
        Alert.alert("Not found", "No book metadata found for this ISBN.");
        return;
      }
      const existing = await fetchBooksByIsbn(meta.isbn);
      showReview(meta, existing.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not look up book.";
      Alert.alert("Error", msg);
    } finally {
      onLookupDone();
    }
  }, [manualIsbn, onLookupDone, showReview]);

  const isWeb = Platform.OS === "web";

  if (review) {
    const r = review;
    const year = r.meta.publishDate
      ? (r.meta.publishDate.match(/\d{4}/) ?? [])[0] ?? r.meta.publishDate
      : "";
    const genre = (r.meta.categories?.length ? r.meta.categories : []).slice(0, 5).join(", ") || "—";
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.reviewContent}>
        <Text style={styles.reviewTitle}>Review book</Text>
        <View style={styles.reviewCard}>
          {r.meta.coverImgUrl ? (
            <Image source={{ uri: r.meta.coverImgUrl }} style={styles.reviewCover} />
          ) : (
            <View style={[styles.reviewCover, styles.reviewCoverPlaceholder]}>
              <Text style={styles.reviewCoverPlaceholderText}>No cover</Text>
            </View>
          )}
          <View style={styles.reviewMeta}>
            <Text style={styles.reviewBookTitle}>{r.meta.title}</Text>
            <Text style={styles.reviewAuthor}>{r.meta.author}</Text>
            {year ? <Text style={styles.reviewDetail}>Year: {year}</Text> : null}
            <Text style={styles.reviewDetail}>Genre: {genre}</Text>
          </View>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>I own this book</Text>
          <Switch
            value={r.own}
            onValueChange={(own) => setReview((prev) => prev ? { ...prev, own } : null)}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>I have read this</Text>
          <Switch
            value={r.haveRead}
            onValueChange={(haveRead) => setReview((prev) => prev ? { ...prev, haveRead } : null)}
          />
        </View>
        <Text style={styles.commentaryLabel}>Comments (optional)</Text>
        <TextInput
          style={styles.commentaryInput}
          placeholder="Add your notes about this book..."
          placeholderTextColor="#999"
          value={r.commentary}
          onChangeText={(commentary) => setReview((prev) => prev ? { ...prev, commentary } : null)}
          multiline
          numberOfLines={3}
          editable
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => submitFromReview(r)}
        >
          <Text style={styles.buttonText}>
            {r.existingCount > 0 ? "Create new copy" : "Add to library"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={dismissReview}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const manualEntrySection = (
    <View style={styles.manualSection}>
      <Text style={styles.manualLabel}>Or enter ISBN manually</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 9780140328721"
        placeholderTextColor="#999"
        value={manualIsbn}
        onChangeText={setManualIsbn}
        keyboardType="number-pad"
        maxLength={17}
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleManualSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Look up & add book</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isWeb) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <View style={styles.centered}>
          <Text style={styles.message}>
            Barcode scanning works on iOS and Android. On web, enter an ISBN below.
          </Text>
          {manualEntrySection}
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (!permission) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.centered}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
        {manualEntrySection}
      </ScrollView>
    );
  }
  if (!permission.granted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.centered}>
          <Text style={styles.message}>Camera permission is required to scan barcodes.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant permission</Text>
          </TouchableOpacity>
        </View>
        {manualEntrySection}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.cameraWrap}>
        <Text style={styles.simulatorHint}>
          In simulator the camera may not show. Use manual entry below.
        </Text>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
        {loading ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Looking up book...</Text>
          </View>
        ) : null}
        {!loading && (
          <View style={styles.footer}>
            <Text style={styles.hint}>Point the camera at a book barcode</Text>
            <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
              <Text style={styles.buttonText}>Scan again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {manualEntrySection}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  reviewContent: { padding: 20, paddingTop: 24 },
  reviewTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  reviewCard: { flexDirection: "row", marginBottom: 20, gap: 16 },
  reviewCover: { width: 100, height: 150, borderRadius: 8, backgroundColor: "#eee" },
  reviewCoverPlaceholder: { justifyContent: "center", alignItems: "center" },
  reviewCoverPlaceholderText: { color: "#888", fontSize: 12 },
  reviewMeta: { flex: 1, justifyContent: "center" },
  reviewBookTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  reviewAuthor: { fontSize: 16, color: "#444", marginBottom: 8 },
  reviewDetail: { fontSize: 14, color: "#666", marginBottom: 2 },
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
  },
  secondaryButton: { marginTop: 12, alignItems: "center", paddingVertical: 14 },
  secondaryButtonText: { color: "#007AFF", fontSize: 16 },
  cameraWrap: { minHeight: 280 },
  camera: { height: 280 },
  simulatorHint: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    color: "#333",
    textAlign: "center",
    fontSize: 14,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  message: { textAlign: "center", marginBottom: 16 },
  manualSection: { padding: 20, paddingTop: 16 },
  manualLabel: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minWidth: 200,
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: { color: "#fff", marginTop: 12 },
  footer: { padding: 20, backgroundColor: "#000" },
  hint: { color: "#fff", textAlign: "center", marginBottom: 12 },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
