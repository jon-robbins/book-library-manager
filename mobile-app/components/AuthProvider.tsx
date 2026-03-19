import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  type User,
} from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/lib/firebase";

const AUTH_STORE_KEY = "auth_session";
const ASYNC_STORAGE_KEY = "auth_state";
const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

interface StoredAuthState {
  uid: string;
  email?: string;
  timestamp: number;
}

/**
 * Safely retrieves and validates stored auth state from AsyncStorage.
 * Returns null if storage is missing, corrupted, or invalid.
 */
async function getStoredAuthState(): Promise<StoredAuthState | null> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;

    // Validate structure
    if (!parsed || typeof parsed !== "object") return null;
    const state = parsed as Record<string, unknown>;
    if (typeof state.uid !== "string") return null;

    return {
      uid: state.uid,
      email: typeof state.email === "string" ? state.email : undefined,
      timestamp: typeof state.timestamp === "number" ? state.timestamp : 0,
    };
  } catch (error) {
    // Corrupted or unparseable data - log and return null
    console.warn("Failed to restore auth state from storage", error);
    return null;
  }
}

/**
 * Stores auth state to AsyncStorage.
 * Handles storage errors gracefully (best-effort persistence).
 */
async function storeAuthState(user: User): Promise<void> {
  try {
    const state: StoredAuthState = {
      uid: user.uid,
      email: user.email || undefined,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist auth state", error);
    // Best-effort: don't fail auth flow if storage write fails
  }
}

/**
 * Clears auth state from AsyncStorage.
 * Handles errors gracefully (best-effort cleanup).
 */
async function clearAuthState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear auth state", error);
    // Best-effort: don't fail logout if storage clear fails
  }
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (tokens: { idToken?: string; accessToken?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (loading) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Persist auth state to AsyncStorage when user changes
  useEffect(() => {
    if (!user) return;
    storeAuthState(user);
  }, [user]);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await getStoredAuthState();
        if (stored) {
          // AsyncStorage provides a cached session reference.
          // Firebase SDK handles token refresh on its own via onAuthStateChanged
          // Our storage is just for UX: showing cached user before Firebase responds
        }
      } catch (error) {
        console.warn("Failed to restore session", error);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign in failed";
      setError(message);
      throw e;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign up failed";
      setError(message);
      throw e;
    }
  }, []);

  const signInWithGoogle = useCallback(async (tokens: { idToken?: string; accessToken?: string }) => {
    setError(null);
    try {
      const credential = GoogleAuthProvider.credential(tokens.idToken ?? null, tokens.accessToken);
      await signInWithCredential(auth, credential);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Google sign in failed";
      setError(message);
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      // Clear both AsyncStorage and SecureStore
      await Promise.all([clearAuthState(), SecureStore.deleteItemAsync(AUTH_STORE_KEY, KEYCHAIN_OPTIONS)]);
    } catch {
      // Continue logout even if storage cleanup fails
    }
    await firebaseSignOut(auth);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    clearError,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
