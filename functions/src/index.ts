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
