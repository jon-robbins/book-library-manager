import { useState, useCallback, useEffect } from "react";
import { View, Text, Image, ImageStyle, StyleProp } from "react-native";
import {
  getBookCoverPrimaryUrl,
  getBookCoverFallbackUrl,
  type BookCoverInput,
} from "@/lib/coverUrl";
import { ImageCache } from "@/lib/imageCache";
import { ImageRetryTracker, isTransientError } from "@/lib/imageReliability";

type Props = {
  book: BookCoverInput;
  style: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  placeholderStyle?: StyleProp<ImageStyle>;
  placeholderText?: string;
  onImageLoad?: () => void;
};

// Shared retry tracker to persist across component instances
const retryTracker = new ImageRetryTracker();

/**
 * Renders a book cover with intelligent fallback, caching, and retry:
 * 1. Try cached URL from successful previous loads
 * 2. Try stored URL (e.g., Google Books) with fallback on error
 * 3. Fall back to Open Library by ISBN
 * 4. Show placeholder if all sources fail
 * 5. Cache successful URLs for faster future loads
 */
export default function BookCoverImage({
  book,
  style,
  resizeMode = "cover",
  placeholderStyle,
  placeholderText = "📖",
  onImageLoad,
}: Props) {
  const bookId = book.isbn;
  const primary = getBookCoverPrimaryUrl(book);
  const fallback = getBookCoverFallbackUrl(book);

  const [uri, setUri] = useState<string | null>(primary ?? fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedUrls, setAttemptedUrls] = useState<Set<string>>(new Set());

  // Load cached URL on mount
  useEffect(() => {
    const loadCachedUrl = async () => {
      try {
        const cachedUrl = await ImageCache.getCachedUrl(bookId);
        if (cachedUrl && !retryTracker.isPermanentlyFailed(cachedUrl)) {
          setUri(cachedUrl);
        }
      } catch (err) {
        // Cache load errors don't break image loading
        console.warn("Failed to load cached image:", err);
      }
    };
    loadCachedUrl();
  }, [bookId]);

  const onLoadSuccess = useCallback(() => {
    if (uri) {
      // Cache successful URL for future loads
      ImageCache.setCachedUrl(bookId, uri).catch((err) => {
        console.warn("Failed to cache image URL:", err);
      });
      onImageLoad?.();
    }
  }, [uri, bookId, onImageLoad]);

  const onError = useCallback(
    (error?: Error | string) => {
      if (!uri) return;

      // Mark this URL as attempted
      setAttemptedUrls((prev) => new Set([...prev, uri]));

      // Check if this is a permanent failure
      const isPermanent = !isTransientError(error);
      if (isPermanent) {
        retryTracker.markPermanentFailure(uri);
      }

      // Try next available URL
      if (uri === primary && fallback && !attemptedUrls.has(fallback)) {
        setUri(fallback);
      } else if (uri === primary && !fallback) {
        // Primary has no fallback, show placeholder
        setUri(null);
      } else {
        // Fallback failed too, show placeholder
        setUri(null);
      }
    },
    [primary, fallback, uri, attemptedUrls]
  );

  useEffect(() => {
    // Update loading state when uri changes
    setIsLoading(false);
  }, [uri]);

  if (!uri) {
    return (
      <View style={[style, placeholderStyle]} accessible={true} accessibilityRole="image" accessibilityLabel="Book cover placeholder">
        <Text style={{ fontSize: 22 }} accessible={false}>{placeholderText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onLoad={onLoadSuccess}
      onError={() => onError()}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={`Book cover for ISBN ${book.isbn || "unknown"}`}
    />
  );
}
