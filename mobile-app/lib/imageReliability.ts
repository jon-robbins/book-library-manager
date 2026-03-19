/**
 * Image reliability utilities: retry logic, exponential backoff, and network awareness.
 * Handles transient failures (timeouts, temporary network issues) vs permanent failures (403, 404).
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500, // Start with 500ms
  maxDelayMs: 5000, // Cap at 5s
  backoffMultiplier: 2, // Double the delay each time
  timeoutMs: 10000, // 10s timeout per attempt
};

/**
 * Classifies an error as transient (worth retrying) or permanent (don't retry).
 * Transient: timeouts, network errors, 408, 429, 5xx
 * Permanent: 403, 404, 400, other 4xx
 */
export function isTransientError(error: unknown): boolean {
  // Network timeouts are transient
  if (error instanceof Error && error.message.includes("timeout")) {
    return true;
  }

  // Network errors are transient
  if (error instanceof Error && error.message.includes("Network")) {
    return true;
  }

  // If we have an HTTP status code, use it to decide
  if (typeof error === "object" && error !== null) {
    const httpError = error as { status?: number };
    if (typeof httpError.status === "number") {
      const status = httpError.status;
      // Retry on server errors, rate limiting, timeout
      if (status === 408 || status === 429 || status >= 500) {
        return true;
      }
      // Don't retry on client errors (403, 404, etc.)
      if (status >= 400 && status < 500) {
        return false;
      }
    }
  }

  // Assume transient for unknown errors
  return true;
}

/**
 * Calculate exponential backoff delay with jitter.
 * Avoids thundering herd when multiple devices retry simultaneously.
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  // Add jitter: ±10% random variation
  const jitter = cappedDelay * (0.9 + Math.random() * 0.2);
  return Math.floor(jitter);
}

/**
 * Sleep for a given number of milliseconds.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff and transient error detection.
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      // Set a timeout for this attempt
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Operation timeout")),
            config.timeoutMs
          )
        ),
      ]);
    } catch (err) {
      lastError = err;

      // Don't retry permanent errors
      if (!isTransientError(err)) {
        throw err;
      }

      // If this was the last attempt, throw
      if (attempt === config.maxAttempts) {
        throw err;
      }

      // Calculate backoff and sleep
      const delayMs = calculateBackoffDelay(attempt, config);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Track retry attempts for an image URL.
 * Useful for monitoring and deciding when to give up retrying a specific URL.
 */
export class ImageRetryTracker {
  private retryCount = new Map<string, number>();
  private permanentFailures = new Set<string>();

  /**
   * Record a retry attempt for a URL.
   */
  recordRetry(url: string): void {
    this.retryCount.set(url, (this.retryCount.get(url) || 0) + 1);
  }

  /**
   * Mark a URL as permanently failed (403, 404, etc).
   */
  markPermanentFailure(url: string): void {
    this.permanentFailures.add(url);
  }

  /**
   * Check if a URL has been marked as permanently failed.
   */
  isPermanentlyFailed(url: string): boolean {
    return this.permanentFailures.has(url);
  }

  /**
   * Get the retry count for a URL.
   */
  getRetryCount(url: string): number {
    return this.retryCount.get(url) || 0;
  }

  /**
   * Clear all tracking.
   */
  reset(): void {
    this.retryCount.clear();
    this.permanentFailures.clear();
  }
}
