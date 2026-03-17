# Library – iOS mobile app (Expo)

React Native (Expo) app for the library MVP: Firebase Auth, Data Connect (Postgres), barcode scanning, and secure Keychain storage.

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase config (`EXPO_PUBLIC_FIREBASE_*`).
2. From the **repository root**, ensure Data Connect SDK is generated:
   ```bash
   firebase dataconnect:sdk:generate
   ```
3. Install and run:
   ```bash
   cd mobile-app && npm install && npx expo start
   ```
4. Run on iOS simulator or device: press `i` in the Expo CLI or open in Expo Go.

## Features

- **Auth**: Email/Password with Firebase Auth; session stored in iOS Keychain via `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
- **Books**: List, add, view, and delete books via Firebase Data Connect (Postgres). All operations are scoped to the signed-in user (`auth.uid`).
- **Barcode**: Scan book barcodes (ISBN); metadata is fetched from Open Library or Google Books (Open Library from the client, no key; Google Books via Firebase callable `getBookByIsbn` with the library service account). Duplicate check shows “You already have this book in your library. Create a new copy?”.
- **Data Connect**: Generated SDK in `lib/dataconnect-generated`. Queries/mutations in `dataconnect/example/queries.gql` (ListMyBooks, GetBooksByUserIdAndIsbn, CreateBook, UpdateBook, DeleteBook).

## App Check and Apple App Attest (production)

The Firebase **JS SDK** does not support Apple App Attest; it only supports reCAPTCHA (web). For production:

1. Use **react-native-firebase** with a **custom Expo dev client** (not Expo Go).
2. Add `@react-native-firebase/app` and `@react-native-firebase/app-check`, and the Expo config plugin for react-native-firebase.
3. On iOS, configure the **App Attest** provider (with DeviceCheck fallback for older iOS). Register the app in Firebase Console > App Check and use the debug provider in development (debug token from the console).
4. Initialize App Check **before** any other Firebase usage (e.g. in app entry or `lib/firebase.ts`). Use the debug provider in dev and App Attest (with DeviceCheck fallback) in release builds.

Until App Check is enabled in the Firebase project, Data Connect and Auth will work without it; enable enforcement in Firebase Console when ready.

## Environment variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

Do not commit `.env`; it is listed in `.gitignore`.

## Book metadata (Open Library & Google Books)

- **Open Library**: Lookup by ISBN is done from the client; no API key is required.
- **Google Books**: Lookup is done via the Firebase callable `getBookByIsbn`, which uses the service account `library-gbooks-api-service@library-84eeb.iam.gserviceaccount.com`. Deploy the function from the repo root with `firebase deploy --only functions` and set the secret `GOOGLE_BOOKS_SERVICE_ACCOUNT_KEY` (full JSON key for that service account) via Firebase Console or `firebase functions:secrets:set GOOGLE_BOOKS_SERVICE_ACCOUNT_KEY`.

### Testing the APIs with curl

**1. Open Library (no auth, no key)**

```bash
# Replace with any ISBN (e.g. 1787335402)
curl -s "https://openlibrary.org/api/books?bibkeys=ISBN:1787335402&format=json&jscmd=details" | jq
```

**2. Google Books public API (no key for basic lookup)**

```bash
curl -s "https://www.googleapis.com/books/v1/volumes?q=isbn:1787335402" | jq '.items[0].volumeInfo | {title, authors, publishedDate, description, categories}'
```

**3. Firebase callable `getBookByIsbn` (uses backend service account)**

Callable functions require a Firebase ID token in the `Authorization` header. From the app you’re already signed in; from curl you need a token.

- Get an ID token: sign in (e.g. in the app or via [Firebase Auth REST](https://firebase.google.com/docs/reference/rest/auth)) and copy the `idToken` from the response.
- Then (replace `YOUR_ID_TOKEN` and the region if you use something other than `us-central1`):

```bash
curl -s -X POST "https://us-central1-library-84eeb.cloudfunctions.net/getBookByIsbn" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"data":{"isbn":"1787335402"}}' | jq
```

If the function is configured to allow unauthenticated access for testing, you can omit the `Authorization` header and try the same `-d` body. The response will be in the form `{"result": { ... book metadata ... }}`.
