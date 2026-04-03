// app/_layout.tsx
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  useFonts as useCormorantFonts,
} from "@expo-google-fonts/cormorant-garamond";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { ImageBackground, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { supabase } from "../lib/supabase";

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  useFonts as useMontserratFonts,
} from "@expo-google-fonts/montserrat";

import { colors } from "../lib/theme";

export default function RootLayout() {
    useEffect(() => {
    let mounted = true;

    async function setupRevenueCat() {
      const apiKey =
        Platform.OS === "android"
          ? process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY
          : process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;

      if (!apiKey) {
        throw new Error("RevenueCat API key is missing for this platform.");
      }

if (!Purchases.isConfigured()) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  Purchases.configure({
    apiKey,
    appUserID: session?.user?.id,
  });
}
    }

    setupRevenueCat();

    return () => {
      mounted = false;
    };
  }, []);

  useCormorantFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
  });

  useMontserratFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
  });

  const navTheme = useMemo(() => {
    return {
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
    };
  }, []);

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