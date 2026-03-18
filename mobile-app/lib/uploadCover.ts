import { getFunctions, httpsCallable } from "firebase/functions";
import * as FileSystem from "expo-file-system/legacy";
import app from "@/lib/firebase";

/**
 * Upload a cover image from a local URI to Firebase Storage via a callable Cloud Function.
 * Uses base64 to avoid Blob/ArrayBuffer issues in React Native. Returns the download URL.
 */
export async function uploadCoverPhoto(uri: string, _userId: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  const functions = getFunctions(app);
  const uploadCoverPhotoFn = httpsCallable<{ base64: string }, { url: string }>(
    functions,
    "uploadCoverPhoto"
  );
  try {
    const result = await uploadCoverPhotoFn({ base64 });
    const url = result.data?.url;
    if (!url) throw new Error("No URL returned from upload.");
    return url;
  } catch (err) {
    if (err && typeof err === "object") {
      const e = err as { message?: string };
      if (typeof e.message === "string" && e.message.trim().length > 0) {
        throw new Error(e.message);
      }
    }
    throw err instanceof Error ? err : new Error("Cover upload failed.");
  }
}
