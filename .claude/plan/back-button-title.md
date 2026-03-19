# Implementation Plan: Fix Back Button Label (Show "Home" Instead of "(tabs)")

## Task Type
- [x] Frontend (→ Mobile / Expo Router)
- [ ] Backend
- [ ] Fullstack

## Requirement Summary

From **Book detail** and **Add book** screens, the back control in the header currently shows "(tabs)" instead of "Home". The fix must ensure the back button displays "Home" (or "Library") on mobile.

**Definition of done (from `docs/jira-issue-DoD.md`):**
- From Book detail screen, back control shows "Home" (or "Library"), not "(tabs)"
- From Add book stack (Add Book, Review book, or Enter details), back control shows "Home" (or "Library"), not "(tabs)"
- Verified on iOS simulator, iOS device, or Android
- No new lint or TypeScript errors; change limited to root layout or tab layout options

---

## Root Cause

Expo Router / React Navigation derives the **back button label** from the **previous screen's `title` option**. The root layout defines:

```tsx
<Stack.Screen name="(tabs)" />
```

Without an explicit `title`, the route segment name "(tabs)" is used as the default. When navigating back from `book/[id]` or the `add` stack, the previous screen is `(tabs)`, so the back button shows "(tabs)".

---

## Technical Solution

Add `options={{ title: "Home" }}` to the `Stack.Screen name="(tabs)"` in the root layout. This is the standard fix for this Expo Router behavior (confirmed by [Stack Overflow](https://stackoverflow.com/questions/77888562/incorrect-title-of-stack-header-back-button-in-expo-router)).

---

## Implementation Steps

1. **Modify root layout** — In `mobile-app/app/_layout.tsx`, add `options={{ title: "Home" }}` to the `(tabs)` Stack.Screen.
2. **Verify** — Run the app on iOS simulator or Android emulator; navigate to Book detail and Add book flows; confirm back button shows "Home".
3. **Lint/TypeScript** — Run `npx tsc --noEmit` and project linter; ensure no new errors.

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `mobile-app/app/_layout.tsx` | Modify | Add `options={{ title: "Home" }}` to `Stack.Screen name="(tabs)"` |

---

## Pseudo-Code

```tsx
// mobile-app/app/_layout.tsx
// BEFORE:
<Stack.Screen name="(tabs)" />

// AFTER:
<Stack.Screen
  name="(tabs)"
  options={{ title: "Home" }}
/>
```

---

## Risks and Mitigation

| Risk | Mitigation |
|------|-------------|
| Header shown for (tabs) when it shouldn't be | Root layout uses `headerShown: false` in `screenOptions`; (tabs) screen itself has no header. The `title` option only affects the back button label when another screen navigates back to it, not the (tabs) screen's own header. |
| Regression in other flows | Change is additive; only sets a display label. No navigation logic altered. |

---

## Verification Checklist

- [ ] Book detail → back button shows "Home"
- [ ] Add book (index) → back button shows "Home"
- [ ] Add book (review) → back button shows "Add Book" (previous in add stack)
- [ ] Add book (details) → back button shows "Review book" (previous in add stack)
- [ ] No lint or TypeScript errors

---

## SESSION_ID (for /ccg:execute use)

- CODEX_SESSION: (N/A — codeagent-wrapper not available)
- GEMINI_SESSION: (N/A — codeagent-wrapper not available)
