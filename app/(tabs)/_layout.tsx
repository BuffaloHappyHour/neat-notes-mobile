// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Platform, Pressable } from "react-native";

import { logClientEvent } from "../../lib/clientLog";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// Wrap the default tab bar button so we can log whether taps reach it.
function LoggedTabBarButton(props: any) {
  const { onPress, accessibilityState, ...rest } = props;
  const selected = !!accessibilityState?.selected;

  // Best-effort route name extraction from expo-router / react-navigation props.
  const routeName =
    props?.to?.pathname ??
    props?.href?.pathname ??
    props?.href ??
    props?.accessibilityLabel ??
    "unknown";

  const handlePress = useCallback(
    (e: any) => {
      // "touch reached tab button" proof
      logClientEvent("tab_press_in", {
        screen: String(routeName),
        detail: {
          selected,
          platform: Platform.OS,
          href: props?.href ?? null,
          to: props?.to ?? null,
          ts: Date.now(),
        },
      });

      // call the real handler
      onPress?.(e);

      // "press completed" proof
      logClientEvent("tab_press", {
        screen: String(routeName),
        detail: {
          selected,
          platform: Platform.OS,
          href: props?.href ?? null,
          to: props?.to ?? null,
          ts: Date.now(),
        },
      });
    },
    [onPress, routeName, selected, props?.href, props?.to]
  );

  // Use Pressable so we always own the press surface.
  return <Pressable {...rest} onPress={handlePress} />;
}

export default function TabsLayout() {
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted ?? "rgba(255,255,255,0.55)",
      tabBarLabelStyle: {
        fontSize: 11,
        fontFamily: type?.body?.fontFamily,
      },
      tabBarStyle: {
        backgroundColor: "transparent",
        borderTopColor: "rgba(255,255,255,0.10)",
        borderTopWidth: Platform.OS === "ios" ? 0.5 : 1,
      },
      // ✅ this is the key: make every tab button loggable
      tabBarButton: (props: any) => <LoggedTabBarButton {...props} />,
    }),
    []
  );

  return (
    <Tabs screenOptions={screenOptions}>
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