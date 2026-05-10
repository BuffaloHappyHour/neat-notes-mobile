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
import { Stack } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { ImageBackground, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { bootstrapApp } from "../lib/bootstrapApp";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

export default function RootLayout() {
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