# Library Firebase Functions

Cloud Functions for the Library app (e.g. `getBookByIsbn` via Google Books API with service account).

## Deploy

From the **repository root**:

```bash
cd functions && npm run build && cd .. && firebase deploy --only functions
```

## First-time / "Build service account missing permissions"

If deploy fails with:

```
Could not build the function due to a missing permission on the build service account.
```

grant the Cloud Build Builder role to the default Compute Engine service account (one-time per project):

```bash
# Replace PROJECT_NUMBER with your GCP project number (e.g. 1011626665033 for library-84eeb).
# Find it: gcloud projects describe library-84eeb --format='value(projectNumber)'

gcloud projects add-iam-policy-binding library-84eeb \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

Example for project number `1011626665033`:

```bash
gcloud projects add-iam-policy-binding library-84eeb \
  --member="serviceAccount:1011626665033-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

Then run `firebase deploy --only functions` again.

See [Cloud Functions troubleshooting](https://cloud.google.com/functions/docs/troubleshooting#build-service-account) for more options (e.g. custom build service account).

## Secret

The callable `getBookByIsbn` requires the secret **GOOGLE_BOOKS_SERVICE_ACCOUNT_KEY** (full JSON key for `library-gbooks-api-service@library-84eeb.iam.gserviceaccount.com`):

```bash
firebase functions:secrets:set GOOGLE_BOOKS_SERVICE_ACCOUNT_KEY
```

Paste the JSON key when prompted (or pipe the key file).

## 401 Unauthorized when calling from curl / Postman

Firebase Callable v2 functions run on Cloud Run. The **gateway** returns 401 before your code runs unless the function is allowed to be invoked by “unauthenticated” HTTP callers at the **IAM** level. Your app then sends the Firebase ID token; the **function** validates that token.

Allow the function to be invoked (so the request reaches your code):

```bash
# Replace region if you use something other than us-central1
gcloud functions add-invoker-policy-binding getBookByIsbn \
  --region=us-central1 \
  --member="allUsers"
```

Or in [Google Cloud Console](https://console.cloud.google.com/functions): open `getBookByIsbn` → **Permissions** → **Add principal** → principal `allUsers`, role **Cloud Functions Invoker** (or **Cloud Run Invoker** for v2). Save.

After this, curl with a valid Firebase ID token should work (token in `Authorization: Bearer <idToken>`).
