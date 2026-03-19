import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleAuth } from "google-auth-library";

if (!admin.apps.length) {
  const projectId = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT;
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    (projectId ? `${projectId}.firebasestorage.app` : undefined);
  admin.initializeApp(storageBucket ? { storageBucket } : undefined);
}

const googleBooksServiceAccountKey = defineSecret("GOOGLE_BOOKS_SERVICE_ACCOUNT_KEY");

/** BookMetadata shape returned to the app (matches mobile-app BookMetadata). */
export interface BookMetadata {
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
}

/** Google Books API volume list response (minimal shape we use). */
interface GoogleBooksVolumeListResponse {
  items?: Array<{
    volumeInfo?: {
      title?: string;
      authors?: string[];
      description?: string;
      publishedDate?: string;
      categories?: string[];
      averageRating?: number;
      ratingsCount?: number;
      language?: string;
      imageLinks?: {
        smallThumbnail?: string;
        thumbnail?: string;
        small?: string;
        medium?: string;
        large?: string;
        extraLarge?: string;
      };
    };
  }>;
}

function normalizeIsbn(isbn: unknown): string | null {
  if (typeof isbn !== "string") return null;
  const digits = isbn.replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

type ImageLinks = NonNullable<
  NonNullable<GoogleBooksVolumeListResponse["items"]>[number]["volumeInfo"]
>["imageLinks"];

function pickHttpsImage(links: ImageLinks): string {
  if (!links) return "";
  const url =
    links.medium ?? links.large ?? links.extraLarge ?? links.thumbnail ?? links.small ?? links.smallThumbnail ?? "";
  if (!url) return "";
  return url.startsWith("http:") ? url.replace("http:", "https:") : url;
}

/**
 * Callable: getBookByIsbn
 * Uses the library Google Books service account to look up book metadata by ISBN.
 * Requires secret GOOGLE_BOOKS_SERVICE_ACCOUNT_KEY (full JSON key for library-gbooks-api-service@library-84eeb.iam.gserviceaccount.com).
 */
export const getBookByIsbn = onCall(
  { secrets: [googleBooksServiceAccountKey] },
  async (request): Promise<BookMetadata> => {
    const isbn = normalizeIsbn(request.data?.isbn);
    if (!isbn) {
      throw new HttpsError("invalid-argument", "Missing or invalid ISBN.");
    }

    const keyJson = googleBooksServiceAccountKey.value();
    let credentials: object;
    try {
      credentials = JSON.parse(keyJson) as object;
    } catch {
      throw new HttpsError("internal", "Invalid service account key configuration.");
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/books"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;
    if (!token) {
      throw new HttpsError("internal", "Could not obtain access token for Google Books API.");
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new HttpsError("internal", `Google Books API error: ${res.status}`);
    }

    const data = (await res.json()) as GoogleBooksVolumeListResponse;
    const item = data.items?.[0];
    if (!item?.volumeInfo) {
      throw new HttpsError("not-found", "No book found for this ISBN.");
    }

    const v = item.volumeInfo;
    const authors = Array.isArray(v.authors) ? v.authors : [];
    const image = pickHttpsImage(v.imageLinks);

    const categories = Array.isArray(v.categories) ? v.categories : [];
    const averageRating =
      typeof v.averageRating === "number" && !Number.isNaN(v.averageRating) ? v.averageRating : null;
    const ratingsCount =
      typeof v.ratingsCount === "number" && Number.isInteger(v.ratingsCount) ? v.ratingsCount : null;

    const meta: BookMetadata = {
      title: v.title ?? "Unknown Title",
      author: authors.length ? authors.join(", ") : "Unknown Author",
      isbn,
      coverImgUrl: image,
      description: v.description ?? "",
      publishDate: v.publishedDate ?? "",
      categories,
      averageRating,
      ratingsCount,
      language: v.language ?? "",
    };

    return meta;
  }
);

/**
 * Callable: uploadCoverPhoto
 * Accepts base64 image data and uploads to Storage. Returns a short-lived signed URL.
 * Avoids Blob/ArrayBuffer issues in React Native. Caller must be authenticated.
 */
export const uploadCoverPhoto = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be signed in to upload a cover.");
  }
  const base64 = request.data?.base64;
  if (typeof base64 !== "string" || !base64) {
    throw new HttpsError("invalid-argument", "Missing or invalid base64 image data.");
  }
  try {
    const buffer = Buffer.from(base64, "base64");
    const filename = `covers/${uid}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.jpg`;
    const bucketName = admin.app().options.storageBucket;
    if (!bucketName) {
      throw new HttpsError("failed-precondition", "Storage bucket is not configured. Set storageBucket in Firebase Admin init or FIREBASE_STORAGE_BUCKET.");
    }
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: { contentType: "image/jpeg" },
    });

    // Signed URL keeps the object private while allowing temporary client access.
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires,
    });
    return { url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    if (typeof message === "string" && /signBlob|Cannot sign data|client_email|iam\.serviceAccounts\.signBlob/i.test(message)) {
      throw new HttpsError(
        "internal",
        "Storage signing is not configured for this function identity. Grant Service Account Token Creator on the runtime service account and enable IAM Service Account Credentials API."
      );
    }
    throw new HttpsError("internal", message);
  }
});

/** Goodreads CSV row (minimal shape we parse). */
interface GoodreadsRow {
  "Book Id": string;
  "Title": string;
  "Author": string;
  "ISBN (\")\": string;
  "ISBN13 (\")\": string;
  "My Rating": string;
  "Average Rating": string;
  "Publisher": string;
  "Bookshelves": string;
  "Date Read": string;
  [key: string]: string;
}

/** Result of parsing a single Goodreads book entry. */
interface ParsedGoodreadsBook {
  isbn: string | null;
  title: string;
  author: string;
  isbn13: string | null;
  myRating: number | null;
  averageRating: number | null;
  publisher: string;
  bookshelves: string[];
  dateRead: string | null;
}

/** Import result for a single book. */
interface ImportResult {
  title: string;
  author: string;
  isbn: string | null;
  status: "success" | "skipped" | "error";
  reason?: string;
}

/** Full import response. */
interface GoodreadsImportResponse {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  results: ImportResult[];
  errors: string[];
}

/**
 * Simple CSV parser for Goodreads exports.
 * Handles quoted fields and escaped quotes.
 */
function parseGoodreadsCSV(csv: string): GoodreadsRow[] {
  const lines = csv.split("\n");
  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const rows: GoodreadsRow[] = [];
  let i = 1;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // Handle multiline quoted fields (rare but possible)
    let fullLine = line;
    let quoteCount = (line.match(/"/g) || []).length;
    i++;
    while (quoteCount % 2 !== 0 && i < lines.length) {
      fullLine += "\n" + lines[i];
      quoteCount += (lines[i].match(/"/g) || []).length;
      i++;
    }

    const values = parseCSVLine(fullLine);
    const row: GoodreadsRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse a Goodreads row into our internal format.
 */
function parseGoodreadsRow(row: GoodreadsRow): ParsedGoodreadsBook {
  const isbn = normalizeIsbn(row["ISBN (\""]) || normalizeIsbn(row["ISBN13 (\")"]) || null;
  const myRating = parseInt(row["My Rating"], 10);
  const avgRating = parseFloat(row["Average Rating"]);

  // Parse bookshelves (comma-separated, may include quotes)
  const bookshelves = row["Bookshelves"]
    ? row["Bookshelves"]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter((s) => s.length > 0)
    : [];

  return {
    isbn,
    title: row["Title"] || "Unknown Title",
    author: row["Author"] || "Unknown Author",
    isbn13: normalizeIsbn(row["ISBN13 (\")"]),
    myRating: !isNaN(myRating) && myRating > 0 ? myRating : null,
    averageRating: !isNaN(avgRating) && avgRating > 0 ? avgRating : null,
    publisher: row["Publisher"] || "",
    bookshelves,
    dateRead: row["Date Read"] ? row["Date Read"] : null,
  };
}

/**
 * Callable: importGoodreadsBooks
 * Imports books from a Goodreads CSV export. Handles validation, deduplication, and batch insertion.
 * Requires user authentication.
 */
export const importGoodreadsBooks = onCall(
  async (request): Promise<GoodreadsImportResponse> => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Must be signed in to import books.");
    }

    const csvData = request.data?.csv;
    if (typeof csvData !== "string" || !csvData.trim()) {
      throw new HttpsError("invalid-argument", "Missing or invalid CSV data.");
    }

    const response: GoodreadsImportResponse = {
      totalProcessed: 0,
      successCount: 0,
      skippedCount: 0,
      errorCount: 0,
      results: [],
      errors: [],
    };

    try {
      // Parse CSV
      const rows = parseGoodreadsCSV(csvData);
      if (rows.length === 0) {
        throw new HttpsError("invalid-argument", "CSV file is empty or has no valid book entries.");
      }

      response.totalProcessed = rows.length;

      // Get existing books for this user to detect duplicates
      const db = admin.firestore();
      const existingBooksSnapshot = await db.collection("Book").where("userId", "==", uid).get();
      const existingISBNs = new Set(
        existingBooksSnapshot.docs.map((doc) => (doc.data() as { isbn: string }).isbn).filter(Boolean)
      );

      // Process each book
      const booksToInsert: Array<{
        userId: string;
        title: string;
        author: string;
        isbn: string;
        haveRead: boolean;
        own: boolean;
        wantToRead: boolean;
      }> = [];

      for (const row of rows) {
        try {
          const parsed = parseGoodreadsRow(row);

          // Validate required fields
          if (!parsed.title || !parsed.author) {
            response.results.push({
              title: parsed.title || "Unknown",
              author: parsed.author || "Unknown",
              isbn: parsed.isbn,
              status: "error",
              reason: "Missing title or author",
            });
            response.errorCount++;
            continue;
          }

          // Skip if no ISBN
          if (!parsed.isbn) {
            response.results.push({
              title: parsed.title,
              author: parsed.author,
              isbn: null,
              status: "skipped",
              reason: "No valid ISBN found",
            });
            response.skippedCount++;
            continue;
          }

          // Skip if duplicate
          if (existingISBNs.has(parsed.isbn)) {
            response.results.push({
              title: parsed.title,
              author: parsed.author,
              isbn: parsed.isbn,
              status: "skipped",
              reason: "Already in your library",
            });
            response.skippedCount++;
            continue;
          }

          // Determine read status from bookshelves or date read
          const haveRead = parsed.dateRead ? parsed.dateRead.length > 0 : parsed.bookshelves.includes("read");
          const wantToRead = parsed.bookshelves.includes("to-read");
          const own = parsed.bookshelves.includes("owned") || parsed.bookshelves.includes("owned-books");

          booksToInsert.push({
            userId: uid,
            title: parsed.title,
            author: parsed.author,
            isbn: parsed.isbn,
            haveRead,
            own,
            wantToRead,
          });

          response.results.push({
            title: parsed.title,
            author: parsed.author,
            isbn: parsed.isbn,
            status: "success",
          });
          response.successCount++;
        } catch (err) {
          const reason = err instanceof Error ? err.message : "Unknown error";
          response.results.push({
            title: row["Title"] || "Unknown",
            author: row["Author"] || "Unknown",
            isbn: normalizeIsbn(row["ISBN (\""]) || normalizeIsbn(row["ISBN13 (\")"]),
            status: "error",
            reason,
          });
          response.errorCount++;
        }
      }

      // Batch insert books to Firestore
      if (booksToInsert.length > 0) {
        const batch = db.batch();
        const booksRef = db.collection("Book");

        for (const book of booksToInsert) {
          const docRef = booksRef.doc();
          batch.set(docRef, {
            ...book,
            id: docRef.id,
            wantToReadPosition: 2147483647,
          });
        }

        await batch.commit();
      }

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      if (err instanceof HttpsError) {
        throw err;
      }
      response.errors.push(message);
      throw new HttpsError("internal", `Import failed: ${message}`);
    }
  }
);
