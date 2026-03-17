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
} from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { CameraView, useCameraPermissions } from "expo-camera";
import { getBookMetadataByIsbn } from "@/lib/booksApi";
import { fetchBooksByIsbn, addBook } from "@/lib/books";

type Props = {
  /** Called when a book was added (e.g. router.back when shown as a stack screen). */
  onAdded?: () => void;
};

async function processIsbn(
  digits: string,
  onDone: () => void,
  onAdded?: () => void
) {
  const meta = await getBookMetadataByIsbn(digits);
  if (!meta) {
    Alert.alert("Not found", "No book metadata found for this ISBN.");
    onDone();
    return;
  }
  const existing = await fetchBooksByIsbn(meta.isbn);
  if (existing.length > 0) {
    Alert.alert(
      "You already have this book in your library. Create a new copy?",
      undefined,
      [
        { text: "Cancel", style: "cancel", onPress: onDone },
        {
          text: "Create new copy",
          onPress: async () => {
            try {
              await addBook({
                title: meta.title,
                author: meta.author,
                isbn: meta.isbn,
                haveRead: false,
                own: true,
                coverImgUrl: meta.coverImgUrl || undefined,
                description: meta.description || undefined,
                publishDate: meta.publishDate || undefined,
                categories: meta.categories?.length ? meta.categories : null,
                averageRating: meta.averageRating ?? undefined,
                ratingsCount: meta.ratingsCount ?? undefined,
                language: meta.language || undefined,
                tags: null,
                commentary: undefined,
              });
              Alert.alert("Added", `"${meta.title}" added as a new copy.`, [
                { text: "OK", onPress: onAdded ?? onDone },
              ]);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Could not add book.";
              Alert.alert("Error", msg);
            } finally {
              onDone();
            }
          },
        },
      ]
    );
    return;
  }
  try {
    await addBook({
      title: meta.title,
      author: meta.author,
      isbn: meta.isbn,
      haveRead: false,
      own: true,
      coverImgUrl: meta.coverImgUrl || undefined,
      description: meta.description || undefined,
      publishDate: meta.publishDate || undefined,
      categories: meta.categories?.length ? meta.categories : null,
      averageRating: meta.averageRating ?? undefined,
      ratingsCount: meta.ratingsCount ?? undefined,
      language: meta.language || undefined,
      tags: null,
      commentary: undefined,
    });
    Alert.alert("Added", `"${meta.title}" added to your library.`, [
      { text: "OK", onPress: onAdded ?? onDone },
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not add book.";
    Alert.alert("Error", msg);
  }
  onDone();
}

export default function ScanScreenContent({ onAdded }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualIsbn, setManualIsbn] = useState("");
  const { user } = useAuth();
  const processingRef = useRef(false);

  const onLookupDone = useCallback(() => {
    setScanned(false);
    setLoading(false);
    processingRef.current = false;
  }, []);

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
          const { meta, existing } = payload;
          if (existing.length > 0) {
            Alert.alert(
              "You already have this book in your library. Create a new copy?",
              undefined,
              [
                { text: "Cancel", style: "cancel", onPress: onLookupDone },
                {
                  text: "Create new copy",
                  onPress: async () => {
                    try {
                      await addBook({
                        title: meta.title,
                        author: meta.author,
                        isbn: meta.isbn,
                        haveRead: false,
                        own: true,
                        coverImgUrl: meta.coverImgUrl || undefined,
                        description: meta.description || undefined,
                        publishDate: meta.publishDate || undefined,
                        categories: meta.categories?.length ? meta.categories : null,
                        averageRating: meta.averageRating ?? undefined,
                        ratingsCount: meta.ratingsCount ?? undefined,
                        language: meta.language || undefined,
                        tags: null,
                        commentary: undefined,
                      });
                      Alert.alert("Added", `"${meta.title}" added as a new copy.`, [
                        { text: "OK", onPress: onAdded ?? onLookupDone },
                      ]);
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : "Could not add book.";
                      Alert.alert("Error", msg);
                    } finally {
                      onLookupDone();
                    }
                  },
                },
              ]
            );
            return;
          }
          return addBook({
            title: meta.title,
            author: meta.author,
            isbn: meta.isbn,
            haveRead: false,
            own: true,
            coverImgUrl: meta.coverImgUrl || undefined,
            description: meta.description || undefined,
            publishDate: meta.publishDate || undefined,
            categories: meta.categories?.length ? meta.categories : null,
            averageRating: meta.averageRating ?? undefined,
            ratingsCount: meta.ratingsCount ?? undefined,
            language: meta.language || undefined,
            tags: null,
            commentary: undefined,
          }).then(() => {
            Alert.alert("Added", `"${meta.title}" added to your library.`, [
              { text: "OK", onPress: onAdded ?? onLookupDone },
            ]);
          });
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "Could not add book.";
          Alert.alert("Error", msg);
        })
        .finally(onLookupDone);
    },
    [user, onLookupDone, onAdded]
  );

  const handleManualSubmit = useCallback(() => {
    const digits = manualIsbn.replace(/\D/g, "");
    if (digits.length < 10) {
      Alert.alert("Invalid ISBN", "Enter at least 10 digits.");
      return;
    }
    if (processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    processIsbn(digits, onLookupDone, onAdded)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Could not add book.";
        Alert.alert("Error", msg);
      })
      .finally(onLookupDone);
  }, [manualIsbn, onLookupDone, onAdded]);

  const isWeb = Platform.OS === "web";

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
