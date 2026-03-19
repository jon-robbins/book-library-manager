# Implementation Plan: TLA-17 — Back Button / Header Consistency (Mobile)

## Overview

TLA-17 polishes navigation and header behavior across the mobile app. TLA-8 already fixed the back button label to "Home" for screens that return to tabs. This ticket extends that work to ensure consistent headers, back button labels, and presentation across all screens.

## Requirements

- **Back button labels**: Every screen that navigates back to another screen shows a clear, user-friendly label (e.g., "Home", "Add Book", "Review book").
- **Header consistency**: Headers are shown/hidden consistently; titles are descriptive and follow a naming convention.
- **Modal behavior**: Scan modal dismisses correctly; back/dismiss UX is predictable.
- **Auth flow**: Auth screens have appropriate headers and back behavior (login ↔ signup).

## Architecture Summary

| Layout | Screens | Header | Back target |
|--------|---------|--------|-------------|
| Root `_layout.tsx` | index, (auth), (tabs), scan, book/[id], add | Root: `headerShown: false`; scan/book: `headerShown: true` | — |
| (tabs) | index (Home), settings | Tab bar; no stack header | — |
| add | index, review, details | Stack header shown | index→Home; review→Add Book; details→Add Book or Review |
| (auth) | login, signup | Default (header shown) | signup→Log in; login→no back (entry) |

## Implementation Steps

### Phase 1: Root Stack — Back Labels

1. **Book detail: add `headerBackTitle: "Home"`** (File: `mobile-app/app/_layout.tsx`)
   - Action: Add `headerBackTitle: "Home"` to `book/[id]` Stack.Screen options.
   - Why: Explicit back label when returning from book detail to Home.
   - Dependencies: None
   - Risk: Low

2. **Add stack: add `headerBackTitle: "Home"`** (File: `mobile-app/app/_layout.tsx`)
   - Action: On `<Stack.Screen name="add" />`, add `options={{ headerBackTitle: "Home" }}` so the first screen (Add Book) shows "Home" when going back.
   - Why: The add group is a nested stack; back from Add Book index goes to (tabs). Explicit label future-proofs against layout changes.
   - Dependencies: None
   - Risk: Low

3. **Scan modal: add `headerBackTitle: "Home"`** (File: `mobile-app/app/_layout.tsx`)
   - Action: Add `headerBackTitle: "Home"` to the scan screen options.
   - Why: Scan is presented as a modal from Home; when dismissed, user returns to Home. Explicit label improves clarity.
   - Dependencies: None
   - Risk: Low

### Phase 2: Add Stack — Internal Back Labels

4. **Add stack: back labels for review and details** (File: `mobile-app/app/add/_layout.tsx`)
   - Action: On `review` screen, add `headerBackTitle: "Add Book"`. On `details` screen, add `headerBackTitle: "Add Book"` (since details can be reached from Add Book index via "Enter details manually" or from review).
   - Why: When on review, back goes to Add Book. When on details, back goes to Add Book (if from manual entry) or Review book (if from ISBN flow). Use the most common case or the previous screen's title. Since details can come from either Add Book or Review, the previous screen's `title` will drive it; we can optionally set `headerBackTitle` for the less common path. **Recommendation**: Rely on React Navigation's default (previous screen title) for add stack internal navigation; only override at root level for "Home".
   - Dependencies: None
   - Risk: Low
   - **Refined**: Add `headerBackTitle` only where it improves UX. For add stack: review → "Add Book", details → "Review book" when coming from review, "Add Book" when coming from index. React Navigation uses previous screen's title, so we get "Add Book" and "Review book" automatically. No change needed for add stack internal screens unless we observe wrong labels.

5. **Add stack: optional headerBackTitleVisible** (File: `mobile-app/app/add/_layout.tsx`)
   - Action: Consider `headerBackTitleVisible: true` in `screenOptions` if iOS truncates labels. Default is true; only add if we want to hide the text and show icon-only back button.
   - Why: iOS shows back button with previous screen title; long titles can truncate. "Add Book", "Review book", "Enter details" are short. Skip unless UX feedback suggests otherwise.
   - Dependencies: None
   - Risk: Low
   - **Decision**: Defer; add only if needed after manual QA.

### Phase 3: Auth Flow — Header Consistency

6. **Auth layout: explicit header options** (File: `mobile-app/app/(auth)/_layout.tsx`)
   - Action: Add `screenOptions={{ headerShown: true }}` and ensure login/signup have `title: "Log in"` and `title: "Sign up"`. Add `headerBackTitle: "Log in"` on signup so back from signup shows "Log in".
   - Why: Auth screens use `router.replace` for post-auth; but user can navigate signup → login via Link, and may use system back. Consistent headers and back labels improve polish.
   - Dependencies: None
   - Risk: Low

### Phase 4: Book Detail — Dynamic Title (Optional Enhancement)

7. **Book detail: dynamic header title** (File: `mobile-app/app/book/[id].tsx`)
   - Action: Use `useLayoutEffect` + `navigation.setOptions` to set `title: book?.title ?? "Book"` when book loads.
   - Implementation:
     ```tsx
     import { useNavigation } from "@react-navigation/native";
     // In component, after book state:
     useLayoutEffect(() => {
       navigation.setOptions({ title: book?.title ?? "Book" });
     }, [navigation, book?.title]);
     ```
   - Why: "Book" is generic; showing the actual title improves context. Truncate long titles if needed (React Navigation handles truncation by default).
   - Dependencies: Step 1 (book screen exists)
   - Risk: Medium — must handle loading/error states (keep "Book" until loaded; avoid flash).
   - **Recommendation**: Implement in Phase 4; ensure title truncates on narrow screens (default header behavior).

### Phase 5: Title Naming Convention

8. **Audit and align screen titles** (Files: `_layout.tsx`, `add/_layout.tsx`, `(auth)/_layout.tsx`)
   - Action: Ensure consistent casing and phrasing. Current: "Scan Barcode", "Book", "Add Book", "Review book", "Enter details", "Log in", "Sign up". Consider: "Scan Barcode" (action), "Book" / book title (entity), "Add Book" (action), "Review Book" (capital B for consistency), "Enter Details" (capital D).
   - Why: Small polish; "Review book" vs "Review Book" — pick one convention.
   - Dependencies: None
   - Risk: Low

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `mobile-app/app/_layout.tsx` | Add `headerBackTitle: "Home"` to scan, book/[id], add |
| `mobile-app/app/add/_layout.tsx` | No change (rely on default) or optional `headerBackTitle` if needed |
| `mobile-app/app/(auth)/_layout.tsx` | Add `headerBackTitle: "Log in"` on signup; explicit `screenOptions` |
| `mobile-app/app/book/[id].tsx` | (Phase 4) Dynamic `title` via `useLayoutEffect` + `router.setOptions` |

---

## Acceptance Criteria

- [ ] **AC1**: From Book detail, back button shows "Home".
- [ ] **AC2**: From Add Book (index), back button shows "Home".
- [ ] **AC3**: From Review book, back button shows "Add Book".
- [ ] **AC4**: From Enter details (from Add Book), back button shows "Add Book".
- [ ] **AC5**: From Enter details (from Review book), back button shows "Review book".
- [ ] **AC6**: From Scan modal, back/dismiss returns to Home; back label shows "Home" when applicable.
- [ ] **AC7**: From Sign up, back button shows "Log in".
- [ ] **AC8**: (Phase 4) Book detail header shows book title when loaded, "Book" while loading.
- [ ] **AC9**: All screens with headers have consistent, readable titles.
- [ ] **AC10**: Verified on iOS simulator and Android emulator.
- [ ] **AC11**: No new lint or TypeScript errors.

---

## Dependencies

- **Expo Router** (existing): Stack.Screen options, `headerBackTitle`, `headerBackTitleVisible`
- **React Navigation**: Underlying stack behavior
- **TLA-8**: Already applied `title: "Home"` on (tabs); this plan builds on that

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| `headerBackTitle` not respected on some iOS/Android versions | Test on both platforms; fallback to default (previous screen title) is acceptable. |
| Dynamic book title causes layout shift or flash | Use `useLayoutEffect`; set title only when `book` is loaded; keep "Book" for loading/error. |
| Auth flow uses `replace`; back button may not appear | Auth entry (login) typically has no back; signup has Link to login. Ensure signup shows "Log in" when back is available. |
| Add stack: details reached from two different screens | React Navigation uses previous screen; no override needed unless we observe wrong labels. |

---

## Testing Strategy (Handoff for tdd-guide)

### Unit / Component Tests

- **File**: `mobile-app/__tests__/navigation-headers.test.tsx` (new)
  - Mock `expo-router` and `@react-navigation/native`; render layout components and assert that `Stack.Screen` options include expected `headerBackTitle` and `title` values.
  - Alternatively: test that `_layout.tsx` exports a component that renders without error and that screen options can be read from the tree (if testable).

- **Existing**: `mobile-app/__tests__/settings.test.tsx` — ensure no regression.

### Integration / Manual QA

- **Navigation matrix** (manual or E2E):
  1. Home → Book detail → Back (expect "Home")
  2. Home → Add → Back (expect "Home")
  3. Home → Add → Review → Back (expect "Add Book")
  4. Home → Add → Details (manual) → Back (expect "Add Book")
  5. Home → Add → Review → (if link to details exists) → Details → Back (expect "Review book")
  6. Home → Scan (modal) → Dismiss/Back (expect return to Home)
  7. Login → Sign up → Back (expect "Log in")

### E2E (if Playwright/Detox available)

- Add E2E for critical back-button flows: Home → Book → Back; Home → Add → Back.
- Current project has no E2E; recommend adding `@testing-library/react-native` navigation tests or manual QA checklist.

---

## File List (Handoff)

| File | Purpose |
|------|---------|
| `mobile-app/app/_layout.tsx` | Root stack; add headerBackTitle to scan, book/[id], add |
| `mobile-app/app/add/_layout.tsx` | Add stack; optional headerBackTitle overrides |
| `mobile-app/app/(auth)/_layout.tsx` | Auth stack; headerBackTitle on signup |
| `mobile-app/app/book/[id].tsx` | Book detail; dynamic title (Phase 4) |
| `mobile-app/__tests__/navigation-headers.test.tsx` | New: assert layout options (optional) |

---

## Implementation Order

1. **Phase 1** (Steps 1–3): Root layout changes — low risk, high impact.
2. **Phase 2** (Steps 4–5): Add stack — defer if defaults work.
3. **Phase 3** (Step 6): Auth layout.
4. **Phase 4** (Step 7): Book detail dynamic title — optional enhancement.
5. **Phase 5** (Step 8): Title casing audit — quick polish.

---

## Success Criteria

- All acceptance criteria (AC1–AC11) pass.
- Back button labels are consistent and user-friendly across the app.
- Headers are shown where appropriate; titles are clear.
- Implementation is minimal and maintainable; no unnecessary overrides.
