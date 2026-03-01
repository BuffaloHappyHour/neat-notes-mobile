// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // ✅ Forces a remount of Tabs when app returns to foreground
  const [tabsKey, setTabsKey] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // Remount tabs to restore touch handling after long background
        setTabsKey((k) => k + 1);
      }
    });
    return () => sub.remove();
  }, []);

  const baseHeight = Platform.OS === "ios" ? 62 : 68;

  // ✅ Clamp iOS inset to avoid bogus values on resume creating a giant overlay
  const rawBottom = Number(insets.bottom ?? 0);
  const safeBottomIOS = Math.min(Math.max(rawBottom, 0), 40);
  const bottomInset = Platform.OS === "ios" ? safeBottomIOS : Math.max(12, rawBottom);

  const tabBarHeight = Math.min(baseHeight + bottomInset, 110);

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

          // Keep on top for touch
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

        tabBarItemStyle: {
          paddingHorizontal: 6,
        },
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