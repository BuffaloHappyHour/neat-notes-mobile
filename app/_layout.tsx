// app/_layout.tsx
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useMemo } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

import { colors } from "../lib/theme";

// Keep splash until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Load BOTH families (Cormorant + Montserrat)
  const [cormorantLoaded] = useCormorantFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
  });

  const [montserratLoaded] = useMontserratFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
  });

  const fontsLoaded = cormorantLoaded && montserratLoaded;

  const navTheme = useMemo(() => {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        // ✅ removes the white layer so ImageBackground shows
        background: "transparent",
        card: "transparent",
        border: "transparent",
        text: DarkTheme.colors.text,
        primary: DarkTheme.colors.primary,
        notification: DarkTheme.colors.notification,
      },
    };
  }, []);

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <ImageBackground
          source={require("../assets/backgrounds/Background.png")}
          style={styles.bg}
          resizeMode="cover"
        >
          {/* subtle dark wash so text/cards feel grounded */}
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