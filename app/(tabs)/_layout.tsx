// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
  headerShown: false,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.textPrimary ?? "rgba(255,255,255,0.55)",
  tabBarLabelStyle: {
    fontSize: 11,
    // (optional) remove fontFamily for this test:
    // fontFamily: type?.body?.fontFamily,
  },
  tabBarStyle: {
    backgroundColor: colors.background, // ✅ not transparent
    borderTopColor: "rgba(255,255,255,0.10)",
    borderTopWidth: Platform.OS === "ios" ? 0.5 : 1,
  },
}}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="log"
        options={{
          title: "Log",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}