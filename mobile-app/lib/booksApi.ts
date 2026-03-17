/**
 * Fetch book metadata by ISBN from Open Library and/or Google Books.
 * Open Library is called from the client (no API key). Google Books is called via
 * a Firebase callable (getBookByIsbn) that uses the library service account.
 * Returns normalized camelCase shape for the app schema.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";

export type BookMetadata = {
  title: string;
  author: string;
  isbn: string;
  coverImgUrl: string;
  description: string;
  publishDate: string;
  categories: string[];
  averageRating: number | null;
  ratingsCount: number | null;
  language: string;
};

const FETCH_TIMEOUT_MS = 10_000;

/** Open Library Books API response with jscmd=details (keyed by bib key). */
interface OpenLibraryDetailsResponse {
  [bibKey: string]: {
    thumbnail_url?: string;
    details?: {
      title?: string;
      description?: string;
      notes?: string;
      publish_date?: string;
      subjects?: string[];
      languages?: Array<{ key?: string }>;
      authors?: Array<{ name?: string }>;
      covers?: number[];
    };
  };
}

function fetchWithTimeout(url: string): Promise<Response> {
  return Promise.race([
    fetch(url),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS)
    ),
  ]);
}

async function fetchOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  const key = `ISBN:${isbn}`;
  const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(key)}&format=json&jscmd=details`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as OpenLibraryDetailsResponse;
    const book = data[key];
    if (!book?.details) return null;
    const d = book.details;
    const authors = d.authors?.map((a) => a.name).filter(Boolean) ?? [];
    const coverUrl =
      book.thumbnail_url ??
      (d.covers?.[0] != null ? `https://covers.openlibrary.org/b/id/${d.covers[0]}-L.jpg` : "");
    const description = d.description ?? d.notes ?? "";
    const categories = Array.isArray(d.subjects) ? d.subjects : [];
    const langEntry = d.languages?.[0]?.key;
    const language = typeof langEntry === "string" ? langEntry.replace(/^\/languages\//, "") : "";
    return {
      title: d.title ?? "Unknown Title",
      author: authors.length ? authors.join(", ") : "Unknown Author",
      isbn,
      coverImgUrl: coverUrl,
      description,
      publishDate: d.publish_date ?? "",
      categories,
      averageRating: null,
      ratingsCount: null,
      language,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch Google Books metadata via Firebase callable (uses service account backend).
 */
async function fetchGoogleBooksViaCallable(isbn: string): Promise<BookMetadata | null> {
  try {
    const functions = getFunctions(app);
    const getBookByIsbn = httpsCallable<{ isbn: string }, BookMetadata>(functions, "getBookByIsbn");
    const result = await Promise.race([
      getBookByIsbn({ isbn }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS)
      ),
    ]);
    return result.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve ISBN to book metadata. Tries Open Library first, then Google Books (via backend) as fallback.
 */
export async function getBookMetadataByIsbn(isbn: string): Promise<BookMetadata | null> {
  const normalized = isbn.replace(/\D/g, "");
  if (!normalized) return null;
  const meta = await fetchOpenLibrary(normalized);
  if (meta) return meta;
  return fetchGoogleBooksViaCallable(normalized);
}
