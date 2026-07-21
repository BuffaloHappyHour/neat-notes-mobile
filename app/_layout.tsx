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
import * as Application from 'expo-application';
import * as Notifications from 'expo-notifications';
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ImageBackground, Linking, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { initAppsFlyer, setCustomerUserId as afSetCustomerUserId } from '../lib/appsflyer';
import { bootstrapApp } from "../lib/bootstrapApp";
import { registerForPushNotifications } from '../lib/notifications';
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import OnboardingModal from "../src/onboarding/OnboardingModal";

function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function syncAppVersion(userId: string) {
      await supabase
        .from('profiles')
        .update({
          app_version: Application.nativeApplicationVersion,
          app_version_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

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
      if (user) {
        void checkOnboarding(user.id);
        void syncAppVersion(user.id);
        afSetCustomerUserId(user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void checkOnboarding(session.user.id);
        void registerForPushNotifications();
        void syncAppVersion(session.user.id);
        afSetCustomerUserId(session.user.id);
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
      initAppsFlyer().catch((e) => console.error('[appsflyer] init failed:', e));
    }

    run();
  }, []);

  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) {
        router.push(url as any);
      }
    });

    // Cold start: delay to let router and auth resolve first
    const timer = setTimeout(async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (!response) return;
      const url = response.notification.request.content.data?.url as string | undefined;
      if (!url) return;
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        router.push(url as any);
      }
    }, 1000);

    return () => {
      responseSub.remove();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    async function handleEventJoinUrl(url: string) {
      try {
        const parsed = new URL(url);

        const isUniversalLink =
          parsed.hostname === "www.neatnotesapp.com" &&
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <ImageBackground
          source={require("../assets/backgrounds/Background.png")}
          style={styles.bg}
          resizeMode="cover"
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

export default RootLayout;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
});