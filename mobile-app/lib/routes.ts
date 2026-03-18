/**
 * Central route definitions. Use these for navigation so the app has a single
 * source of truth for the library home (and other key routes).
 */

/** Route to the library homepage (Home tab – book list). Use (tabs) root so Expo Router resolves correctly; first tab is index/Home. */
export const LIBRARY_HOME = "/(tabs)" as const;
