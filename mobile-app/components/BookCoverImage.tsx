import { useState, useCallback } from "react";
import { View, Text, Image, ImageStyle, StyleProp } from "react-native";
import {
  getBookCoverPrimaryUrl,
  getBookCoverFallbackUrl,
  type BookCoverInput,
} from "@/lib/coverUrl";

type Props = {
  book: BookCoverInput;
  style: StyleProp<ImageStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  placeholderStyle?: StyleProp<ImageStyle>;
  placeholderText?: string;
};

/**
 * Renders a book cover: tries stored URL (e.g. Google Books) first for better
 * coverage, falls back to Open Library by ISBN on load error (e.g. 403).
 */
export default function BookCoverImage({
  book,
  style,
  resizeMode = "cover",
  placeholderStyle,
  placeholderText = "📖",
}: Props) {
  const primary = getBookCoverPrimaryUrl(book);
  const fallback = getBookCoverFallbackUrl(book);
  const [uri, setUri] = useState<string | null>(primary ?? fallback);
  const [errored, setErrored] = useState(false);

  const onError = useCallback(() => {
    if (errored) return;
    setErrored(true);
    if (uri === primary && fallback) setUri(fallback);
    else if (uri === primary && !fallback) setUri(null);
  }, [primary, fallback, uri, errored]);

  if (!uri) {
    return (
      <View style={[style, placeholderStyle]}>
        <Text style={{ fontSize: 22 }}>{placeholderText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={onError}
    />
  );
}
