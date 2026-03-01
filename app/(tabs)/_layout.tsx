// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Forces a remount of Tabs (helps when iOS mounts tab touches/gestures in a bad state)
  const [tabsKey, setTabsKey] = useState(0);

  // Track background time so we don't remount constantly
  const lastBackgroundAt = useRef<number | null>(null);

  useEffect(() => {
    // ✅ Cold-start stabilization: remount once shortly after first render
    const t = setTimeout(() => {
      setTabsKey((k) => k + 1);
    }, 200);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        lastBackgroundAt.current = Date.now();
      }

      if (state === "active") {
        const last = lastBackgroundAt.current;
        const awayMs = last ? Date.now() - last : 0;

        // ✅ Only remount if we were away long enough to matter
        if (awayMs > 1500) {
          setTabsKey((k) => k + 1);
        }
      }
    });

    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, []);

  const baseHeight = Platform.OS === "ios" ? 62 : 68;

  // Keep Android minimum, but iOS can use its real inset
  const rawBottom = Number(insets.bottom ?? 0);
  const bottomInset = Platform.OS === "ios" ? rawBottom : Math.max(12, rawBottom);

  const tabBarHeight = baseHeight + bottomInset;

  return (
    <Tabs
      key={tabsKey}
      screenOptions={{
        headerShown: false,

tabBarStyle: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,

  backgroundColor: colors.surface,
  borderTopColor: colors.divider,
  borderTopWidth: 1,

  paddingTop: Platform.OS === "ios" ? 6 : 10,
  paddingBottom: bottomInset,
  height: tabBarHeight,

  // ✅ Overlay/touch guard: don't let the container block touches outside its children
  pointerEvents: "box-none",

  // Keep above screen content
  zIndex: 9999,
},

        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,

        tabBarLabelStyle: {
          fontFamily: type.body.fontFamily,
          fontSize: 11,
          letterSpacing: 0.3,
          marginTop: 2,
        },

        tabBarItemStyle: { paddingHorizontal: 6 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="log"
        options={{
          title: "Log",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "create" : "create-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size ?? 22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}