/**
 * TLA-9: Cover image reliability tests
 * Tests for fallback, retry, caching, and error handling behaviors.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import BookCoverImage from "@/components/BookCoverImage";
import { ImageCache } from "@/lib/imageCache";
import {
  isTransientError,
  calculateBackoffDelay,
  retryWithBackoff,
  ImageRetryTracker,
  DEFAULT_RETRY_CONFIG,
} from "@/lib/imageReliability";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

describe("ImageCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stores and retrieves cached image URLs", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    AsyncStorage.setItem.mockResolvedValue(undefined);

    const testUrl = "https://example.com/cover.jpg";
    await ImageCache.setCachedUrl("isbn123", testUrl);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@cover_image_cache:isbn123",
      expect.stringContaining(testUrl)
    );
  });

  it("returns null for non-existent cached URLs", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    AsyncStorage.getItem.mockResolvedValue(null);

    const result = await ImageCache.getCachedUrl("missing-isbn");
    expect(result).toBeNull();
  });

  it("returns null for expired cached URLs", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;

    // Create an expired cache entry
    const expiredData = {
      url: "https://example.com/cover.jpg",
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      expiresAt: Date.now() - 1 * 60 * 60 * 1000, // Expired 1 hour ago
    };

    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredData));

    const result = await ImageCache.getCachedUrl("isbn123");
    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "@cover_image_cache:isbn123"
    );
  });

  it("invalidates cached URLs on demand", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;

    await ImageCache.invalidateCachedUrl("isbn123");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "@cover_image_cache:isbn123"
    );
  });

  it("handles cache write errors gracefully", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    AsyncStorage.setItem.mockRejectedValue(new Error("Storage full"));

    // Should not throw
    await ImageCache.setCachedUrl("isbn123", "https://example.com/cover.jpg");
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("clears all image cache entries", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    AsyncStorage.getAllKeys.mockResolvedValue([
      "@cover_image_cache:isbn1",
      "@cover_image_cache:isbn2",
      "@other_cache:data",
    ]);

    await ImageCache.clearAll();
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      "@cover_image_cache:isbn1",
      "@cover_image_cache:isbn2",
    ]);
  });
});

describe("Image Reliability - Error Classification", () => {
  it("classifies timeout errors as transient", () => {
    const error = new Error("Request timeout");
    expect(isTransientError(error)).toBe(true);
  });

  it("classifies network errors as transient", () => {
    const error = new Error("Network request failed");
    expect(isTransientError(error)).toBe(true);
  });

  it("classifies 5xx errors as transient", () => {
    const error = { status: 500 };
    expect(isTransientError(error)).toBe(true);

    const error503 = { status: 503 };
    expect(isTransientError(error503)).toBe(true);
  });

  it("classifies 408 (Request Timeout) as transient", () => {
    const error = { status: 408 };
    expect(isTransientError(error)).toBe(true);
  });

  it("classifies 429 (Too Many Requests) as transient", () => {
    const error = { status: 429 };
    expect(isTransientError(error)).toBe(true);
  });

  it("classifies 403 (Forbidden) as permanent", () => {
    const error = { status: 403 };
    expect(isTransientError(error)).toBe(false);
  });

  it("classifies 404 (Not Found) as permanent", () => {
    const error = { status: 404 };
    expect(isTransientError(error)).toBe(false);
  });

  it("classifies 400 (Bad Request) as permanent", () => {
    const error = { status: 400 };
    expect(isTransientError(error)).toBe(false);
  });

  it("assumes unknown errors are transient", () => {
    const error = new Error("Unknown error");
    expect(isTransientError(error)).toBe(true);
  });
});

describe("Image Reliability - Backoff Calculation", () => {
  it("calculates exponential backoff with initial delay", () => {
    const delay = calculateBackoffDelay(1, DEFAULT_RETRY_CONFIG);
    expect(delay).toBeGreaterThanOrEqual(
      DEFAULT_RETRY_CONFIG.initialDelayMs * 0.9
    );
    expect(delay).toBeLessThanOrEqual(
      DEFAULT_RETRY_CONFIG.initialDelayMs * 1.1
    );
  });

  it("doubles delay on each retry attempt", () => {
    const delay1 = calculateBackoffDelay(1, DEFAULT_RETRY_CONFIG);
    const delay2 = calculateBackoffDelay(2, DEFAULT_RETRY_CONFIG);
    // delay2 should be roughly 2x delay1 (accounting for jitter)
    expect(delay2).toBeGreaterThan(delay1);
  });

  it("caps backoff delay at maxDelayMs", () => {
    const delay = calculateBackoffDelay(10, DEFAULT_RETRY_CONFIG);
    expect(delay).toBeLessThanOrEqual(
      DEFAULT_RETRY_CONFIG.maxDelayMs * 1.1
    );
  });

  it("adds jitter to prevent thundering herd", () => {
    const delays = Array.from({ length: 10 }, () =>
      calculateBackoffDelay(2, DEFAULT_RETRY_CONFIG)
    );
    // Delays should vary (jitter applied)
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});

describe("Image Reliability - Retry Logic", () => {
  it("retries failed operations until success", async () => {
    let attempts = 0;
    const operation = jest.fn(async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error("Request timeout"); // Transient
      }
      return "success";
    });

    const result = await retryWithBackoff(operation);
    expect(result).toBe("success");
    expect(attempts).toBe(2);
  });

  it("stops retrying permanent errors immediately", async () => {
    let attempts = 0;
    const operation = jest.fn(async () => {
      attempts++;
      throw new Error("403 Forbidden"); // Mark as permanent somehow
      // Actually, for this test we need to mock the status
    });

    // Create permanent error
    const permanentError = new Error("403 Forbidden");
    (permanentError as any).status = 403;

    const operation2 = jest.fn(async () => {
      attempts++;
      throw permanentError;
    });

    await expect(retryWithBackoff(operation2)).rejects.toThrow();
    expect(attempts).toBe(1); // Should not retry permanent errors
  });

  it("respects maxAttempts configuration", async () => {
    let attempts = 0;
    const operation = jest.fn(async () => {
      attempts++;
      throw new Error("Timeout");
    });

    const config = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 2 };

    await expect(retryWithBackoff(operation, config)).rejects.toThrow();
    expect(attempts).toBe(2);
  });

  it("respects operation timeout", async () => {
    const operation = jest.fn(
      () =>
        new Promise(
          (resolve) =>
            setTimeout(() => resolve("success"), 5000) // Slow operation
        )
    );

    const config = {
      ...DEFAULT_RETRY_CONFIG,
      maxAttempts: 1,
      timeoutMs: 100, // Very short timeout
    };

    await expect(retryWithBackoff(operation, config)).rejects.toThrow(
      "timeout"
    );
  });
});

describe("ImageRetryTracker", () => {
  it("tracks retry attempts per URL", () => {
    const tracker = new ImageRetryTracker();
    const url = "https://example.com/cover.jpg";

    tracker.recordRetry(url);
    expect(tracker.getRetryCount(url)).toBe(1);

    tracker.recordRetry(url);
    expect(tracker.getRetryCount(url)).toBe(2);
  });

  it("marks URLs as permanently failed", () => {
    const tracker = new ImageRetryTracker();
    const url = "https://example.com/cover.jpg";

    expect(tracker.isPermanentlyFailed(url)).toBe(false);
    tracker.markPermanentFailure(url);
    expect(tracker.isPermanentlyFailed(url)).toBe(true);
  });

  it("returns 0 retries for unknown URLs", () => {
    const tracker = new ImageRetryTracker();
    expect(tracker.getRetryCount("unknown-url")).toBe(0);
  });

  it("resets all tracking data", () => {
    const tracker = new ImageRetryTracker();
    tracker.recordRetry("url1");
    tracker.markPermanentFailure("url2");

    tracker.reset();
    expect(tracker.getRetryCount("url1")).toBe(0);
    expect(tracker.isPermanentlyFailed("url2")).toBe(false);
  });
});

describe("BookCoverImage Component - Fallback Behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders placeholder when no cover URL available", () => {
    const book = {
      isbn: "invalid-isbn",
      coverImgUrl: null,
    };

    render(
      <BookCoverImage
        book={book}
        style={{ width: 100, height: 100 }}
        placeholderText="📖"
      />
    );

    const text = screen.getByText("📖");
    expect(text).toBeTruthy();
  });

  it("renders primary cover image when available", () => {
    const book = {
      isbn: "978-0-134-68599-1",
      coverImgUrl: "https://books.google.com/covers/1",
    };

    render(
      <BookCoverImage book={book} style={{ width: 100, height: 100 }} />
    );

    const image = screen.getByRole("image");
    expect(image).toBeTruthy();
  });

  it("renders fallback cover on primary error", async () => {
    const book = {
      isbn: "978-0-134-68599-1",
      coverImgUrl: "https://books.google.com/covers/1",
    };

    const { getByRole } = render(
      <BookCoverImage book={book} style={{ width: 100, height: 100 }} />
    );

    // Simulate primary image error
    const image = getByRole("image");
    image.props.onError();

    // Should now use fallback
    await waitFor(() => {
      const updated = getByRole("image");
      expect(updated.props.source.uri).toContain("openlibrary.org");
    });
  });

  it("calls onImageLoad callback on successful load", () => {
    const onImageLoad = jest.fn();
    const book = {
      isbn: "978-0-134-68599-1",
      coverImgUrl: "https://example.com/cover.jpg",
    };

    const { getByRole } = render(
      <BookCoverImage
        book={book}
        style={{ width: 100, height: 100 }}
        onImageLoad={onImageLoad}
      />
    );

    const image = getByRole("image");
    image.props.onLoad();

    expect(onImageLoad).toHaveBeenCalled();
  });

  it("handles missing ISBN gracefully", () => {
    const book = {
      isbn: "",
      coverImgUrl: "https://example.com/cover.jpg",
    };

    render(
      <BookCoverImage book={book} style={{ width: 100, height: 100 }} />
    );

    const image = screen.getByRole("image");
    expect(image).toBeTruthy();
  });
});

describe("BookCoverImage Component - Caching Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads cached URL on mount", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    const cachedUrl = "https://cached-cover.example.com/image.jpg";

    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        url: cachedUrl,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })
    );

    const book = {
      isbn: "978-0-134-68599-1",
      coverImgUrl: "https://example.com/cover.jpg",
    };

    render(
      <BookCoverImage book={book} style={{ width: 100, height: 100 }} />
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        "@cover_image_cache:978-0-134-68599-1"
      );
    });
  });

  it("caches successful image URLs", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    AsyncStorage.getItem.mockResolvedValue(null);

    const book = {
      isbn: "978-0-134-68599-1",
      coverImgUrl: "https://example.com/cover.jpg",
    };

    const { getByRole } = render(
      <BookCoverImage book={book} style={{ width: 100, height: 100 }} />
    );

    // Trigger successful load
    const image = getByRole("image");
    image.props.onLoad();

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@cover_image_cache:978-0-134-68599-1",
        expect.stringContaining("https://example.com/cover.jpg")
      );
    });
  });
});
