import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY_PREFIX = "@cover_image_cache:";
const CACHE_EXPIRY_HOURS = 24;

export interface CachedImageData {
  url: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Caches successful image URLs in AsyncStorage with TTL-based expiry.
 * Helps reduce network requests and provides quick fallback for poor connectivity.
 */
export class ImageCache {
  /**
   * Store a successful image URL in cache.
   * @param bookId - Unique identifier for the book
   * @param url - The image URL that loaded successfully
   */
  static async setCachedUrl(bookId: string, url: string): Promise<void> {
    try {
      const now = Date.now();
      const expiresAt = now + CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
      const data: CachedImageData = { url, timestamp: now, expiresAt };
      await AsyncStorage.setItem(
        CACHE_KEY_PREFIX + bookId,
        JSON.stringify(data)
      );
    } catch (err) {
      // Cache write failures should not break image loading
      console.warn("Failed to cache image URL:", err);
    }
  }

  /**
   * Retrieve a cached image URL if it exists and hasn't expired.
   * @param bookId - Unique identifier for the book
   * @returns Cached URL or null if not found or expired
   */
  static async getCachedUrl(bookId: string): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEY_PREFIX + bookId);
      if (!stored) return null;

      const data: CachedImageData = JSON.parse(stored);
      const now = Date.now();

      // Check expiry
      if (now > data.expiresAt) {
        // Clean up expired entry
        await AsyncStorage.removeItem(CACHE_KEY_PREFIX + bookId);
        return null;
      }

      return data.url;
    } catch (err) {
      // Corrupted cache should not prevent loading
      console.warn("Failed to read cached image URL:", err);
      return null;
    }
  }

  /**
   * Invalidate a cached URL (e.g., if it's now broken).
   */
  static async invalidateCachedUrl(bookId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY_PREFIX + bookId);
    } catch (err) {
      console.warn("Failed to invalidate cached image URL:", err);
    }
  }

  /**
   * Clear all image cache entries.
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (err) {
      console.warn("Failed to clear image cache:", err);
    }
  }
}
