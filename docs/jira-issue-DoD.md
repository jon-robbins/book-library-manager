# Jira issues: specific definition of done

Testable, concrete criteria for each issue. Use these in Jira as the Definition of done or Acceptance criteria.

---

## 1. Fix back button label (show "Home" not "(tabs)")

**PRD ref:** UX/nav

**Definition of done (specific):**
- From **Book detail** screen, the back control in the header shows the text "Home" (or "Library"), not "(tabs)".
- From **Add book** stack (Add Book, Review book, or Enter details), the back control shows "Home" (or "Library"), not "(tabs)".
- Verified on at least one of: iOS simulator, iOS device, or Android.
- No new lint or TypeScript errors; change is limited to root layout or tab layout options.

---

## 2. Improve cover image reliability and coverage

**PRD ref:** P0 – cover from Google Books API

**Definition of done (specific):**
- For books where Google Books returns a cover URL, the cover image **loads in the app** (no 403 or broken image) when viewing the book list and book detail.
- When the primary cover URL fails (e.g. 403), the app shows a fallback cover (e.g. Open Library by ISBN) without requiring a manual refresh.
- At least one of: (a) backend proxy for Google Books image URLs, or (b) client-side fix (e.g. referrerPolicy or proxied URL) is implemented and documented in code or README.
- Existing "Add book" and "View book" flows still work; no regression in metadata or cover display for Open Library–only books.

---

## 3. Improve UX – visual design and polish

**PRD ref:** –

**Definition of done (specific):**
- A **design system** or style guide is documented (in code as constants/themes or in a short doc): at least primary color(s), typography (e.g. font family/sizes for title vs body), and standard spacing (e.g. 8/16/24).
- **Login and Sign up** screens use the design system; layout and controls look intentional (e.g. aligned, consistent padding).
- **Home (book list)** and **Book detail** screens use the design system; book cards/rows and detail layout are consistent and readable.
- **Review book / Add book** form uses the design system; labels, inputs, and buttons are visually consistent with the rest of the app.
- **Empty state:** When the user has zero books, Home shows a clear message (e.g. "No books yet") and a clear call-to-action (e.g. "Scan a barcode" or "+ Add").
- **Loading state:** When books or book detail are loading, a spinner or skeleton is shown (no blank content area).
- **Error state:** When loading books fails, an error message and a retry action are shown (no silent failure).

---

## 4. Implement Google Sign-In (SSO)

**PRD ref:** –

**Definition of done (specific):**
- **Firebase Console:** Google sign-in provider is enabled for the project.
- **Login screen:** A "Sign in with Google" (or equivalent) button is visible and tappable.
- **Sign-in flow:** Tapping it opens the Google account picker; after the user selects an account, the app signs in and navigates to the Home (tabs) screen; the user is logged in (auth state reflects the Google user).
- **Session:** After a successful Google sign-in, closing and reopening the app keeps the user signed in (no immediate logout).
- **Regression:** Email/password sign-in and sign-up still work; existing users can log in as before.
- **Sign up screen:** Either the same "Sign in with Google" option is available, or a clear path to sign in with Google is present (e.g. link to login).
- Verified on at least one of: iOS simulator with Google account, or physical iOS/Android device.

---

## 5. Persist auth state with AsyncStorage

**PRD ref:** –

**Definition of done (specific):**
- The app uses `@react-native-async-storage/async-storage` with Firebase Auth's `getReactNativePersistence` (or equivalent) so that auth state is persisted to device storage.
- **Test:** Sign in (email/password or Google), force-quit the app, reopen the app; the user remains signed in and sees the Home screen (no redirect to login).
- The README (or equivalent) no longer states that auth defaults to memory-only persistence; it documents that persistence is enabled (and how, if relevant).
- No regression: sign-out still clears the session; sign-in still works as before.

---

## 6. Advanced search (author, year range, filters)

**PRD ref:** P0 – Advanced search

**Definition of done (specific):**
- **Author filter:** User can enter or select an author (string match); the book list (or tile view) shows only books matching that author.
- **Year range filter:** User can specify a year or range (e.g. "2020" or "2018–2022"); the list shows only books whose publish date falls in that range.
- **Multiple filters:** Applying both author and year (and any other filters) shows only books that satisfy all criteria.
- **Data:** Filtering uses the existing book schema (e.g. author, publishDate); new or updated Data Connect queries (or client-side filter) are implemented and used by the UI.
- **UI:** Filters are accessible from the main book list (or a dedicated search/filter screen); results are shown in the same list/tile view as the main library (no dead ends).
- **Empty result:** When no books match, the UI shows a clear "No books match" (or similar) message.

---

## 7. Web app P0 – tile page and basic flows

**PRD ref:** P0 – Simple HTML webpage

**Definition of done (specific):**
- **Tile page:** The web app has a main page that displays the user's books in a **tiling layout**; each book is one tile showing **cover image** and **subtext** (title and author).
- **Quick filters:** A dropdown (or equivalent control) lets the user filter by: "Books I own," "Books I want to read" (or "Have not read" if that's the product choice), and **Genre** (or categories); the tile list updates to show only matching books.
- **Book details:** Clicking a tile opens a book detail view showing at least: title, author, cover, and commentary (if present); the user can edit and save commentary (long-form text).
- **Enter new book:** The web app supports adding a book; user can enter an ISBN (manual input); the app looks up metadata (via existing or new API) and fills in title, author, year, etc.; user can save the book to their library; cover is displayed (using existing or new cover handling).
- **Auth:** The web app has a way to sign in (e.g. email/password or Google); only the signed-in user's books are shown; unauthenticated users are redirected to login or see an empty state with a sign-in prompt.
- **Tech:** Implemented in the existing `web-app` (Vite) project; uses the same Data Connect connector (or equivalent) as the mobile app for books and auth where applicable.

---

## 8. Web app – advanced search and parity

**PRD ref:** P0 – Advanced search

**Definition of done (specific):**
- **Author and year search:** The web app has the same advanced search behavior as mobile (or as specified in issue 6): filter by author (string match) and year/range; multiple filters combine correctly.
- **Redirect to tile page:** After applying search/filters, the user sees the results on the **tile page** (same layout as the main tile page), not a different page type.
- **Empty result:** When no books match the search, the tile page shows a clear message (e.g. "No books match your search").
- **Consistency:** Filter and search behavior is documented or obvious enough that a user could use the web app for the same workflows as mobile (search by author/year, view results as tiles).

---

## 9. "Books I want to read" (if separate list)

**PRD ref:** P0 – Searchable database

**Definition of done (specific):**
- **Product decision recorded:** It is decided whether "Books I want to read" is (a) a separate list/wishlist (e.g. a distinct collection or flag) or (b) a filter on "have not read" over the same library. Decision is documented in the ticket or a linked doc.
- **If separate list:** A new list or view exists (e.g. "Want to read" tab or screen); the user can add/remove books from it; the list shows only those books; data model (e.g. new field or table) and Data Connect/API are updated; mobile (and web if in scope) show this list.
- **If filter only:** The existing book list supports a filter "Books I want to read" (e.g. haveRead = false) and the UI labels it clearly; no new data model required.
- **DoD is satisfied only after the chosen option is implemented and verified in the app.**

---

## 10. Back button / header consistency

**PRD ref:** –

**Definition of done (specific):**
- **Root stack:** Every `Stack.Screen` in `mobile-app/app/_layout.tsx` that shows a header has an explicit `title` set in `options` (no screen shows a raw route segment like "(tabs)" or "(auth)" in the header or back button).
- **Add stack:** Every screen in the Add flow has an explicit, user-friendly title (already: "Add Book," "Review book," "Enter details").
- **Auth stack:** Login and Sign up screens have explicit titles (already: "Log in," "Sign up").
- **Book detail:** Book detail screen has an explicit title; back button from this screen shows the correct previous screen name (e.g. "Home").
- **Scan:** Scan modal already has title "Scan Barcode"; no change required unless we rename it.
- **Checklist:** A quick pass on iOS and Android confirms no back button or header shows "(tabs)", "(auth)", or a blank/default route name.

---

## 11. Error and empty states

**PRD ref:** –

**Definition of done (specific):**
- **Home – empty:** When the user has zero books, the Home screen shows a dedicated empty state: message (e.g. "No books yet") and at least one action (e.g. "Add your first book" or "+" that opens add flow); no generic error or blank list only.
- **Home – error:** When fetching the book list fails (e.g. network error), the Home screen shows an error message (e.g. "Could not load books") and a **Retry** (or "Try again") control; tapping it re-fetches the list.
- **Book detail – error:** When fetching a single book fails (e.g. invalid id or network), the user sees an error message and a way to go back (e.g. back button or "Go back" link).
- **Add/Review – error:** When add book or lookup fails, the existing Alert or error message is sufficient; no new requirement unless currently missing.
- **Loading:** Home and Book detail show a loading indicator (spinner or skeleton) while data is loading; no requirement to change if already present.

---

## 12. Accessibility pass

**PRD ref:** –

**Definition of done (specific):**
- **Labels:** All interactive elements on Login, Sign up, Home (list and empty state), Book detail, and Add/Review book have accessible labels (e.g. `accessibilityLabel` on React Native); images (e.g. book covers) have meaningful labels or are marked decorative where appropriate.
- **Focus order:** On the key screens above, focus moves in a logical order (e.g. top to bottom, form fields in sequence); no focus traps.
- **Screen reader:** On at least one platform (iOS VoiceOver or Android TalkBack), a user can: sign in, open the book list, open a book detail, and initiate add book; no critical flow is unreachable or unannounced.
- **Contrast/visibility:** Text and controls meet a minimum contrast requirement (e.g. WCAG AA) or no new low-contrast text is introduced; existing issues can be logged as follow-up.
- **Documentation:** A short checklist (in the ticket or in code/docs) lists the screens and elements that were checked for labels, focus, and screen reader.

---

## 13. App Check (Apple App Attest) for production

**PRD ref:** –

**Definition of done (specific):**
- **Firebase:** App Check is enabled in the Firebase project for the iOS app (and Android if applicable); Apple App Attest (with DeviceCheck fallback if required) is configured; a debug provider is configured for development.
- **App:** The app initializes App Check before any Firebase Auth or Data Connect usage (e.g. in `mobile-app/lib/firebase.ts` or app entry); debug token is used in dev builds; App Attest (and fallback) is used in release builds.
- **Dependencies:** The implementation follows the approach in `mobile-app/README.md` (react-native-firebase, custom dev client, etc.); the README is updated to reflect the current App Check setup (e.g. how to get a debug token, how to switch providers).
- **Verification:** In development, the app runs with the debug provider and can call Auth and Data Connect; in a release build (or TestFlight), the app runs with App Attest (or fallback) and can still sign in and load books; no unexplained "unverified client" errors for valid builds.
- **Enforcement:** Firebase Console is configured to enforce App Check for the APIs used by the app (Auth, Functions, etc.) where desired; doc or ticket notes any temporary exceptions (e.g. web not yet enforced).

---

## 14. Import books from Goodreads library export

**PRD ref:** Enhancement

**Definition of done (specific):**
- **CSV parsing:** A function or script reads a Goodreads library export CSV (columns: Book Id, Title, Author, ISBN, ISBN13, Year Published, Exclusive Shelf, Owned Copies, etc.); handles Excel-style quoted ISBNs (e.g. `=""9780593538241"""`) and extracts digits.
- **Goodreads link:** For each row, the book’s Goodreads URL is `https://goodreads.com/book/show/{Book Id}` (e.g. book_id 101673225 → goodreads.com/book/show/101673225).
- **ISBN resolution:** When ISBN or ISBN13 is present in the CSV, use it for metadata lookup; when missing, optionally fetch the Goodreads book page by Book Id and scrape the ISBN from the page (e.g. from the “ISBN” row in the book details block).
- **Book creation:** For each row with a resolved ISBN, use the existing metadata flow (e.g. `getBookMetadataByIsbn`) and create the book in the app’s library for the current user; map Goodreads fields (e.g. Exclusive Shelf “read” → haveRead, Owned Copies → own) where the data model supports it.
- **Deduplication:** Import does not create duplicate books (e.g. skip or merge when the same ISBN already exists for the user).
- **Documentation:** README or script comments describe the CSV format, how to run the import (e.g. path to CSV or upload), and that scraping is used only when ISBN is missing (with rate limiting or batching noted).
