// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Make iOS content sit a bit lower inside the bar, but don't mess with screen layout height.
  const baseHeight = Platform.OS === "ios" ? 62 : 68;
  const bottomInset = Platform.OS === "ios" ? insets.bottom : Math.max(12, insets.bottom);
  const tabBarHeight = baseHeight + bottomInset;

  return (
    <Tabs
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