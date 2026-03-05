// app/_layout.tsx
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

// Keep splash until fonts + auth are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const pathname = usePathname();

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

  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

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

  // 1) Hydrate auth state + subscribe (NO navigation here)
  useEffect(() => {
    let alive = true;

    async function hydrate() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;

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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack>
      
    </ThemeProvider>
  </SafeAreaProvider>
);
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
});