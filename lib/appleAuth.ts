import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "./supabase";

export async function signInWithApple() {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (err: any) {
    if (err.code === "ERR_REQUEST_CANCELED") {
      throw Object.assign(new Error("Sign in cancelled"), { cancelled: true });
    }
    throw new Error(err?.message ?? "Apple Sign In failed. Please try again.");
  }

  const { identityToken, fullName } = credential;

  if (!identityToken) {
    throw new Error("Apple Sign In failed: no identity token returned.");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
  });

  if (error) throw new Error(error.message);

  const { session, user } = data;

  if (user) {
    const firstName = fullName?.givenName?.trim() ?? "";
    const lastName = fullName?.familyName?.trim() ?? "";
    const hasName = firstName || lastName;

    try {
      if (hasName) {
        // Apple only sends fullName on the very first sign-in — persist immediately
        const displayName = [firstName, lastName].filter(Boolean).join(" ");
        await supabase.from("profiles").upsert({
          id: user.id,
          display_name: displayName || (user.email?.split("@")[0] ?? "Apple User"),
          ...(firstName ? { first_name: firstName } : {}),
        });
      } else {
        // Returning sign-in: ensure a profile row exists
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        if (!existing) {
          await supabase.from("profiles").upsert({
            id: user.id,
            display_name: user.email?.split("@")[0] ?? "Apple User",
          });
        }
      }
    } catch (profileErr) {
      console.error("Apple profile upsert failed (non-fatal):", profileErr);
    }
  }

  return session;
}
