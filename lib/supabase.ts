import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// Expo public env vars (safe to bundle)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
}

/**
 * Supabase stores some values as JSON (session) and some as plain strings (PKCE code verifier).
 * Our earlier SafeStorage attempted JSON.parse on everything, which deletes the PKCE verifier
 * and breaks magic links / recovery flows with:
 *   "PKCE code verifier not found in storage"
 *
 * Fix: only validate JSON when the value *looks* like JSON.
 */
const SafeStorage = {
  async getItem(key: string) {
    const value = await AsyncStorage.getItem(key);
    if (value == null) return null;

    const trimmed = value.trim();

    // Only attempt JSON validation if it looks like JSON.
    // PKCE verifier + other auth helpers are plain strings and must be preserved.
    const looksLikeJson =
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"));

    if (!looksLikeJson) return value;

    try {
      JSON.parse(value);
      return value;
    } catch {
      // Corrupted/truncated JSON – wipe it so auth can recover
      await AsyncStorage.removeItem(key);
      return null;
    }
  },
  async setItem(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SafeStorage as any,
    storageKey: "neatnotes-auth",
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false, // required for React Native (we handle deep links manually)
  },
});
