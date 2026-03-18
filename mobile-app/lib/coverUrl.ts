/**
 * Book cover URLs: prefer stored (e.g. Google Books) for coverage, fall back to Open Library by ISBN.
 *
 * Google's imageLinks often return 403 when embedded (referrer). Use primary URL first,
 * then onError fall back to Open Library so we get Google's better coverage when it loads.
 */
export type BookCoverInput = {
  isbn: string;
  coverImgUrl?: string | null;
};

/** URL to try first (stored cover, e.g. Google Books). Use in Image source; onError try fallback. */
export function getBookCoverPrimaryUrl(book: BookCoverInput): string | null {
  const url = book.coverImgUrl?.trim();
  return url || null;
}

/** Fallback URL (Open Library by ISBN). Use when primary fails to load (e.g. 403). */
export function getBookCoverFallbackUrl(book: BookCoverInput): string | null {
  const digits = book.isbn?.replace(/\D/g, "") ?? "";
  if (digits.length >= 10) {
    return `https://covers.openlibrary.org/b/isbn/${digits}-L.jpg`;
  }
  return null;
}

/** Single URL when you don't need fallback: primary if present, else Open Library. */
export function getBookCoverUrl(book: BookCoverInput): string | null {
  return getBookCoverPrimaryUrl(book) ?? getBookCoverFallbackUrl(book);
}
