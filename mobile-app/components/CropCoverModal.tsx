import { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadCoverPhoto } from "@/lib/uploadCover";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_CROP = 50;
const HANDLE_SIZE = 36;

type CropRect = { originX: number; originY: number; width: number; height: number };

type Props = {
  visible: boolean;
  imageUri: string;
  userId: string;
  onDone: (coverUrl: string) => void;
  onCancel: () => void;
  onRetake: () => void;
};

export default function CropCoverModal({
  visible,
  imageUri,
  userId,
  onDone,
  onCancel,
  onRetake,
}: Props) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [layoutSize, setLayoutSize] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !imageUri) return;
    let cancelled = false;
    Image.getSize(
      imageUri,
      (width, height) => {
        if (!cancelled) setImageSize({ width, height });
      },
      () => {
        if (!cancelled) setImageSize({ width: 800, height: 1200 });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [visible, imageUri]);

  useEffect(() => {
    if (!imageSize || !layoutSize) return;
    const padX = imageSize.width * 0.1;
    const padY = imageSize.height * 0.1;
    setCrop({
      originX: padX,
      originY: padY,
      width: Math.max(MIN_CROP, imageSize.width - padX * 2),
      height: Math.max(MIN_CROP, imageSize.height - padY * 2),
    });
  }, [imageSize, layoutSize]);

  const scale = imageSize && layoutSize
    ? Math.min(layoutSize.width / imageSize.width, layoutSize.height / imageSize.height)
    : 1;
  const displayW = imageSize ? imageSize.width * scale : 0;
  const displayH = imageSize ? imageSize.height * scale : 0;
  const marginX = layoutSize ? Math.max(0, (layoutSize.width - displayW) / 2) : 0;
  const marginY = layoutSize ? Math.max(0, (layoutSize.height - displayH) / 2) : 0;

  const cropToDisplay = useCallback(
    (r: CropRect) => ({
      left: marginX + (r.originX / imageSize!.width) * displayW,
      top: marginY + (r.originY / imageSize!.height) * displayH,
      width: (r.width / imageSize!.width) * displayW,
      height: (r.height / imageSize!.height) * displayH,
    }),
    [imageSize, displayW, displayH, marginX, marginY]
  );

  const clampCrop = useCallback((r: CropRect): CropRect => {
    if (!imageSize) return r;
    const minW = MIN_CROP;
    const minH = MIN_CROP;
    let { originX, originY, width, height } = r;
    if (originX < 0) {
      width += originX;
      originX = 0;
    }
    if (originY < 0) {
      height += originY;
      originY = 0;
    }
    if (originX + width > imageSize.width) width = imageSize.width - originX;
    if (originY + height > imageSize.height) height = imageSize.height - originY;
    if (width < minW) {
      width = minW;
      if (originX + width > imageSize.width) originX = imageSize.width - width;
    }
    if (height < minH) {
      height = minH;
      if (originY + height > imageSize.height) originY = imageSize.height - height;
    }
    return { originX, originY, width, height };
  }, [imageSize]);

  const moveCorner = useCallback(
    (which: "tl" | "tr" | "bl" | "br", dx: number, dy: number) => {
      if (!crop || !imageSize || displayW <= 0 || displayH <= 0) return;
      const scaleX = imageSize.width / displayW;
      const scaleY = imageSize.height / displayH;
      const ix = dx * scaleX;
      const iy = dy * scaleY;
      let next: CropRect;
      switch (which) {
        case "tl":
          next = {
            originX: crop.originX + ix,
            originY: crop.originY + iy,
            width: crop.width - ix,
            height: crop.height - iy,
          };
          break;
        case "tr":
          next = {
            originX: crop.originX,
            originY: crop.originY + iy,
            width: crop.width + ix,
            height: crop.height - iy,
          };
          break;
        case "bl":
          next = {
            originX: crop.originX + ix,
            originY: crop.originY,
            width: crop.width - ix,
            height: crop.height + iy,
          };
          break;
        case "br":
          next = {
            originX: crop.originX,
            originY: crop.originY,
            width: crop.width + ix,
            height: crop.height + iy,
          };
          break;
      }
      setCrop(clampCrop(next));
    },
    [crop, imageSize, displayW, displayH, clampCrop]
  );

  const pan = useCallback(
    (which: "tl" | "tr" | "bl" | "br") =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, ev) => {
          moveCorner(which, ev.dx, ev.dy);
        },
      }),
    [moveCorner]
  );

  const handleUsePhoto = useCallback(async () => {
    if (!crop || !imageSize || !userId) return;
    setLoading(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(crop.originX),
              originY: Math.round(crop.originY),
              width: Math.round(crop.width),
              height: Math.round(crop.height),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      const url = await uploadCoverPhoto(result.uri, userId);
      onDone(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not crop or upload.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [crop, imageSize, imageUri, userId, onDone]);

  if (!visible) return null;

  const box = crop && imageSize ? cropToDisplay(crop) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerButton} />
          <Text style={styles.title}>Crop cover</Text>
          <TouchableOpacity
            onPress={handleUsePhoto}
            disabled={loading}
            style={styles.headerButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[styles.headerButtonText, styles.primary]}>Use photo</Text>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={styles.imageContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setLayoutSize({ width, height });
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                imageSize && {
                  width: displayW,
                  height: displayH,
                  marginLeft: marginX,
                  marginTop: marginY,
                },
              ]}
              resizeMode="contain"
            />
          ) : null}

          {box && (
            <>
              <View style={[styles.overlay, styles.overlayTop, { height: box.top }]} />
              <View
                style={[
                  styles.overlay,
                  styles.overlayLeft,
                  {
                    top: box.top,
                    width: box.left,
                    height: box.height,
                  },
                ]}
              />
              <View
                style={[
                  styles.overlay,
                  styles.overlayRight,
                  {
                    top: box.top,
                    left: box.left + box.width,
                    width: layoutSize ? layoutSize.width - (box.left + box.width) : 0,
                    height: box.height,
                  },
                ]}
              />
              <View
                style={[
                  styles.overlay,
                  styles.overlayBottom,
                  {
                    top: box.top + box.height,
                    height: layoutSize ? layoutSize.height - (box.top + box.height) : 0,
                  },
                ]}
              />
              <View
                style={[
                  styles.cropBox,
                  {
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                  },
                ]}
              >
                <View
                  style={[styles.corner, { left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 }]}
                  {...pan("tl").panHandlers}
                />
                <View
                  style={[
                    styles.corner,
                    { left: box.width - HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 },
                  ]}
                  {...pan("tr").panHandlers}
                />
                <View
                  style={[
                    styles.corner,
                    { left: -HANDLE_SIZE / 2, top: box.height - HANDLE_SIZE / 2 },
                  ]}
                  {...pan("bl").panHandlers}
                />
                <View
                  style={[
                    styles.corner,
                    {
                      left: box.width - HANDLE_SIZE / 2,
                      top: box.height - HANDLE_SIZE / 2,
                    },
                  ]}
                  {...pan("br").panHandlers}
                />
              </View>
            </>
          )}
        </View>

        <Text style={styles.hint}>Drag the corners to define the book cover area</Text>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomButton} onPress={onCancel}>
            <Text style={styles.bottomButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={onRetake}>
            <Text style={styles.bottomButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerButton: { minWidth: 70, alignItems: "center", justifyContent: "center" },
  headerButtonText: { color: "#fff", fontSize: 16 },
  primary: { color: "#007AFF", fontWeight: "600" },
  title: { color: "#fff", fontSize: 17, fontWeight: "600" },
  imageContainer: {
    flex: 1,
    alignSelf: "stretch",
  },
  image: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  overlay: {
    position: "absolute",
    left: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayTop: { top: 0, width: SCREEN_WIDTH },
  overlayLeft: { left: 0 },
  overlayRight: {},
  overlayBottom: { width: SCREEN_WIDTH },
  cropBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
  },
  corner: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 2,
    borderColor: "#fff",
  },
  hint: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  bottomButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  bottomButtonText: {
    color: "#fff",
    fontSize: 17,
  },
});
