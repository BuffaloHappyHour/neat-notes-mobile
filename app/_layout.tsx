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
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ImageBackground, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { bootstrapApp } from "../lib/bootstrapApp";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

// Hold the native splash until bootstrap resolves.
// Must be called at module level, before any component renders.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [bootstrapDone, setBootstrapDone] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        // Configure RevenueCat first — bootstrapApp depends on it
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

        // Premium sync runs here on every cold open.
        // Ensures is_premium is always fresh before any screen renders.
        await bootstrapApp();
      } catch (e) {
        console.error("[bootstrap] unexpected error:", e);
      } finally {
        setBootstrapDone(true);
      }
    }

    run();
  }, []);

  // Hide splash only after React has committed the real view tree.
  // Calling hideAsync() while the component returns null causes iOS to hang.
  useEffect(() => {
    if (bootstrapDone) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [bootstrapDone]);

  const [cormorantLoaded] = useCormorantFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
  });

  const [montserratLoaded] = useMontserratFonts({
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

  // Return null while bootstrapping or fonts are loading — native splash is still visible
  if (!bootstrapDone || !cormorantLoaded || !montserratLoaded) return null;

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
