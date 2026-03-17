import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import { auth } from "@/lib/firebase";

const AUTH_STORE_KEY = "auth_credentials";
const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (loading) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const storeAuth = async () => {
      try {
        const token = await user.getIdToken();
        await SecureStore.setItemAsync(AUTH_STORE_KEY, JSON.stringify({ uid: user.uid, token }), KEYCHAIN_OPTIONS);
      } catch {
        // best-effort persistence
      }
    };
    storeAuth();
  }, [user]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = await SecureStore.getItemAsync(AUTH_STORE_KEY, KEYCHAIN_OPTIONS);
        if (raw) {
          // Auth state will be set by onAuthStateChanged when Firebase restores the user
          // We only persist for offline/restart; Firebase SDK handles token refresh
        }
      } catch {
        // ignore
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

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await SecureStore.deleteItemAsync(AUTH_STORE_KEY, KEYCHAIN_OPTIONS);
    } catch {
      // ignore
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
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
