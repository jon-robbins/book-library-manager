# Library

iOS library management app MVP: Expo (React Native), Firebase Auth, Firebase Data Connect (Postgres), barcode scanning, and secure Keychain storage.

## Project structure

- **mobile-app/** – Expo app (Expo Router, Firebase Auth, Data Connect SDK, barcode scanner). See [mobile-app/README.md](mobile-app/README.md) for setup and App Check/App Attest notes.
- **dataconnect/** – Firebase Data Connect schema and connector (Book table, queries, mutations). SDK is generated into `web-app` and `mobile-app`.
- **web-app/** – Optional web client (Vite + React); uses the same Data Connect connector.

## Quick start

1. **Firebase**: Create a project, enable Email/Password Auth, set up Data Connect (e.g. `firebase init dataconnect` if not already done). Add `.env` in `mobile-app/` with `EXPO_PUBLIC_FIREBASE_*` (see `mobile-app/.env.example`).
2. **Generate Data Connect SDK**: From repo root, `firebase dataconnect:sdk:generate`.
3. **Mobile app**: `cd mobile-app && npm install && npx expo start`, then run on iOS.

## Security

- Auth state is stored only in **expo-secure-store** with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (no AsyncStorage).
- Data Connect operations use `@auth(level: USER)` and `userId_expr: "auth.uid"` so users only access their own books.
- For production, use **react-native-firebase** with **Apple App Attest** for App Check; see [mobile-app/README.md](mobile-app/README.md).
