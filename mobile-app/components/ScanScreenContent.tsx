import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BookMetadata } from "@/lib/booksApi";
import { getBookMetadataByIsbn } from "@/lib/booksApi";
import { fetchBooksByIsbn, addBook } from "@/lib/books";
import BookReviewForm, {
  metaToReviewState,
  buildAddBookPayload,
  type ReviewState,
} from "@/components/BookReviewForm";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SCAN_RECT_WIDTH = SCREEN_WIDTH * 0.75;
const SCAN_RECT_HEIGHT = SCREEN_HEIGHT * 0.32;
const SCAN_LEFT = (SCREEN_WIDTH - SCAN_RECT_WIDTH) / 2;
const SCAN_TOP = (SCREEN_HEIGHT - SCAN_RECT_HEIGHT) / 2;
const SCAN_RIGHT = SCAN_LEFT + SCAN_RECT_WIDTH;
const SCAN_BOTTOM = SCAN_TOP + SCAN_RECT_HEIGHT;

type Props = {
  onAdded?: () => void;
};

export default function ScanScreenContent({ onAdded }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const { user } = useAuth();
  const processingRef = useRef(false);

  const onLookupDone = useCallback(() => {
    setScanned(false);
    setLoading(false);
    processingRef.current = false;
  }, []);

  const showReview = useCallback((meta: BookMetadata, existingCount: number) => {
    setReview(metaToReviewState(meta, existingCount));
    onLookupDone();
  }, [onLookupDone]);

  const dismissReview = useCallback(() => {
    setReview(null);
  }, []);

  const submitFromReview = useCallback(
    async (r: ReviewState) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        await addBook(buildAddBookPayload(r));
        Alert.alert(
          "Added",
          r.existingCount > 0
            ? `"${r.title}" added as a new copy.`
            : `"${r.title}" added to your library.`,
          [{ text: "OK", onPress: () => onAdded?.() }]
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not add book.";
        Alert.alert("Error", msg);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
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

  const isWeb = Platform.OS === "web";

  if (review) {
    const r = review;
    return (
      <BookReviewForm
        state={r}
        onUpdate={(key, value) =>
          setReview((prev) => (prev ? { ...prev, [key]: value } : null))
        }
        onSubmit={() => submitFromReview(r)}
        onCancel={dismissReview}
        submitting={submitting}
      />
    );
  }
  if (isWeb) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.message}>
            Barcode scanning works on iOS and Android. Use the + menu for Manual entry.
          </Text>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Dark overlay with clear rectangle in center */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />
      <View style={[styles.overlaySide, styles.overlayLeft]} />
      <View style={[styles.overlaySide, styles.overlayRight]} />

      <View style={styles.scanFrame}>
        <View style={styles.scanFrameCorner} />
        <View style={[styles.scanFrameCorner, styles.scanFrameCornerTr]} />
        <View style={[styles.scanFrameCorner, styles.scanFrameCornerBl]} />
        <View style={[styles.scanFrameCorner, styles.scanFrameCornerBr]} />
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Looking up book...</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { justifyContent: "center", alignItems: "center", padding: 20 },
  message: { textAlign: "center", color: "#fff", marginBottom: 16 },
  button: { backgroundColor: "#007AFF", padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  overlayTop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    height: SCAN_TOP,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    top: SCAN_BOTTOM,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlaySide: {
    position: "absolute",
    top: SCAN_TOP,
    width: SCAN_LEFT,
    height: SCAN_RECT_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayLeft: { left: 0 },
  overlayRight: { left: SCAN_RIGHT, right: 0, width: undefined },
  scanFrame: {
    position: "absolute",
    left: SCAN_LEFT,
    top: SCAN_TOP,
    width: SCAN_RECT_WIDTH,
    height: SCAN_RECT_HEIGHT,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  scanFrameCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: "#fff",
    left: 0,
    top: 0,
  },
  scanFrameCornerTr: { left: undefined, right: 0, borderLeftWidth: 0, borderRightWidth: 3 },
  scanFrameCornerBl: { top: undefined, bottom: 0, borderTopWidth: 0, borderBottomWidth: 3 },
  scanFrameCornerBr: {
    left: undefined,
    right: 0,
    top: undefined,
    bottom: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#fff", marginTop: 12 },
});
