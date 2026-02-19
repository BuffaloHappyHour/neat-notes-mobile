// WhiskeyAppBeta/app/auth/callback.tsx
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

function parseParamsFromUrl(url: string) {
  const out: Record<string, string> = {};

  const grab = (s: string) => {
    if (!s) return;
    s.split("&").forEach((pair) => {
      if (!pair) return;
      const idx = pair.indexOf("=");
      const k = idx >= 0 ? pair.slice(0, idx) : pair;
      const v = idx >= 0 ? pair.slice(idx + 1) : "";
      if (!k) return;

      const key = decodeURIComponent(k.replace(/\+/g, " "));
      const val = decodeURIComponent(v.replace(/\+/g, " "));
      out[key] = val;
    });
  };

  const qIndex = url.indexOf("?");
  if (qIndex >= 0) {
    const afterQ = url.slice(qIndex + 1);
    const beforeHash = afterQ.split("#")[0];
    grab(beforeHash);
  }

  const hIndex = url.indexOf("#");
  if (hIndex >= 0) {
    const afterH = url.slice(hIndex + 1);
    grab(afterH);
  }

  return out;
}

export default function AuthCallback() {
  const [status, setStatus] = useState("Finishing authentication…");

  useEffect(() => {
    let cancelled = false;

    // 🔁 Pattern B web reset page (replace with your real domain)
    const WEB_RESET_URL = "https://YOUR_VERCEL_DOMAIN/auth/reset";

    async function handleUrl(url: string | null) {
      if (!url) {
        router.replace("/sign-in");
        return;
      }

      console.log("AUTH CALLBACK URL =", url);

      try {
        const params = parseParamsFromUrl(url);

        const errorDesc = params.error_description || params.error;
        if (errorDesc) {
          router.replace("/sign-in");
          return;
        }

        // Supabase often includes `type=recovery` on reset links
        const flowType = String(params.type ?? "").toLowerCase();
        const isRecovery = flowType === "recovery";

        const code = params.code;
        const access_token = params.access_token;
        const refresh_token = params.refresh_token;

        if (code) {
          setStatus("Verifying link…");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (access_token && refresh_token) {
          setStatus("Restoring session…");
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
        } else {
          router.replace("/sign-in");
          return;
        }

        if (cancelled) return;

        // ✅ Pattern B: if this is a recovery link, open the WEB reset page.
        if (isRecovery) {
          setStatus("Opening secure reset page…");
          try {
            await Linking.openURL(WEB_RESET_URL);
          } catch {
            // If openURL fails, at least don't strand them in callback
          }
          router.replace("/sign-in");
          return;
        }

        // Otherwise normal auth callback (email confirm / magic link)
        router.replace("/(tabs)/home");
      } catch {
        if (!cancelled) router.replace("/sign-in");
      }
    }

    Linking.getInitialURL().then(handleUrl);

    const sub = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    return () => {
      cancelled = true;
      // @ts-ignore
      sub?.remove?.();
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <ActivityIndicator />
      <Text style={[type.body, { opacity: 0.8, textAlign: "center" }]}>{status}</Text>
    </View>
  );
}
