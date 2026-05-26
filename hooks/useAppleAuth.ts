import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { signInWithApple } from "../lib/appleAuth";

export function useAppleAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      return await signInWithApple();
    } catch (err: any) {
      setError(err?.message ?? "Apple Sign In failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { isAvailable, signIn, loading, error };
}
