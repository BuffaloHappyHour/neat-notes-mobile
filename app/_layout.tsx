// app/_layout.tsx
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  useFonts as useCormorantFonts,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  useFonts as useMontserratFonts,
} from "@expo-google-fonts/montserrat";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ImageBackground, Linking, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { bootstrapApp } from "../lib/bootstrapApp";
import { registerForPushNotifications } from '../lib/notifications';
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import OnboardingModal from "../src/onboarding/OnboardingModal";

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboarding(userId: string) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("onboarding_seen_at")
        .eq("id", userId)
        .maybeSingle();
      if (!profileRow?.onboarding_seen_at) {
        setShowOnboarding(true);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) { void checkOnboarding(user.id); void registerForPushNotifications(); }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void checkOnboarding(session.user.id);
        void registerForPushNotifications();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function run() {
      const apiKey =
        Platform.OS === "android"
          ? process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY
          : process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;

      if (apiKey) {
        const alreadyConfigured = await Purchases.isConfigured();
        if (!alreadyConfigured) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          Purchases.configure({
            apiKey,
            appUserID: session?.user?.id ?? null,
          });
        }
      }

      bootstrapApp().catch((e) => console.error("[bootstrap] unexpected error:", e));
    }

    run();
  }, []);

  useEffect(() => {
    async function handleEventJoinUrl(url: string) {
      try {
        const parsed = new URL(url);

        const isUniversalLink =
          parsed.hostname === "neatnotesapp.com" &&
          parsed.pathname === "/event/join";
        const isCustomScheme =
          parsed.protocol === "neatnotes:" &&
          parsed.hostname === "event" &&
          parsed.pathname === "/join";

        if (!isUniversalLink && !isCustomScheme) return;

        const code = parsed.searchParams.get("code");
        if (!code) return;
        const { data, error } = await supabase.rpc("join_event", { p_join_code: code });
        if (error || !data) {
          Alert.alert("Invalid Code", "Invalid or expired event code.");
          return;
        }
        router.push(`/event/${data}` as any);
      } catch {}
    }

    // Cold start: app opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) handleEventJoinUrl(url);
    });

    // Warm: link opened while app is running
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleEventJoinUrl(url);
    });
    return () => sub.remove();
  }, []);

  const [cormorantLoaded, cormorantError] = useCormorantFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
  });

  const [montserratLoaded, montserratError] = useMontserratFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
  });

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: "transparent",
        card: "transparent",
        border: "transparent",
        text: DarkTheme.colors.text,
        primary: DarkTheme.colors.primary,
        notification: DarkTheme.colors.notification,
      },
    }),
    []
  );

  useEffect(() => {
    if (cormorantError) console.warn("[fonts] Cormorant load failed:", cormorantError);
    if (montserratError) console.warn("[fonts] Montserrat load failed:", montserratError);
  }, [cormorantError, montserratError]);

        setIsAuthed(!!data.session?.user);
        setAuthReady(true);
      } catch {
        if (!alive) return;
        setIsAuthed(false);
        setAuthReady(true);
      }
    }

    hydrate();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setIsAuthed(!!session?.user);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // 2) After the navigator is mounted (fonts + auth ready), enforce the correct side
  useEffect(() => {
    if (!fontsLoaded || !authReady) return;

    const path = String(pathname ?? "");

    if (isAuthed) {
      if (!path.startsWith("/(tabs)")) {
        router.replace("/(tabs)/home");
      }
    } else {
      // If they’re anywhere in tabs while signed out, send to sign-in
      if (path.startsWith("/(tabs)")) {
        router.replace("/sign-in");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded, authReady, isAuthed]);

  // Hide splash only when both are ready
  useEffect(() => {
    if (fontsLoaded && authReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authReady]);

  // Don’t render app UI until ready (keeps splash up)
  if (!fontsLoaded || !authReady) return null;

return (
  <SafeAreaProvider>
    <ThemeProvider value={navTheme}>
      {/* DEBUG: remove ImageBackground to eliminate any layering issues */}
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "transparent" },
            headerShadowVisible: false,
            headerTintColor: colors.textPrimary as any,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <View style={styles.tint} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: "transparent" },
              headerShadowVisible: false,
              headerTintColor: colors.textPrimary as any,
              contentStyle: { backgroundColor: "transparent" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scan" options={{ headerShown: false }} />
          </Stack>
        </ImageBackground>
      </ThemeProvider>
      <OnboardingModal
          visible={showOnboarding}
          onDismiss={() => setShowOnboarding(false)}
        />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
});