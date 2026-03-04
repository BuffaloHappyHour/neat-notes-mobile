// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";
import { Platform, Pressable } from "react-native";

import { logClientEvent } from "../../lib/clientLog";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

function LoggedTabBarButton(props: any) {
  const { onPress, accessibilityState, ...rest } = props;
  const selected = !!accessibilityState?.selected;

  const pathname = usePathname();

  // Keep latest pathname for async checks
  const pathnameRef = useRef<string>(pathname ?? "unknown");
  pathnameRef.current = pathname ?? "unknown";

  const routeName =
    props?.to?.pathname ??
    props?.href?.pathname ??
    props?.href ??
    props?.accessibilityLabel ??
    "unknown";

  const handlePress = useCallback(
    (e: any) => {
      const fromPath = pathnameRef.current ?? "unknown";
      const target = String(routeName);

      void logClientEvent("tab_press_in", {
        screen: target,
        detail: {
          selected,
          platform: Platform.OS,
          from: fromPath,
          href: props?.href ?? null,
          to: props?.to ?? null,
          ts: Date.now(),
        },
      });

      onPress?.(e);

      void logClientEvent("tab_press", {
        screen: target,
        detail: {
          selected,
          platform: Platform.OS,
          from: fromPath,
          href: props?.href ?? null,
          to: props?.to ?? null,
          ts: Date.now(),
        },
      });

      setTimeout(() => {
        const afterPath = pathnameRef.current ?? "unknown";

        void logClientEvent("tab_nav_check", {
          screen: target,
          detail: {
            from: fromPath,
            after: afterPath,
            changed: afterPath !== fromPath,
            platform: Platform.OS,
            selected,
            ts: Date.now(),
          },
        });
      }, 350);
    },
    [onPress, routeName, selected, props?.href, props?.to]
  );

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

      // Force tab bar to own the bottom hit-test region on iOS
      tabBarStyle: {
        position: "absolute" as const,
        left: 0,
        right: 0,
        bottom: 0,

        backgroundColor: "transparent",
        borderTopColor: "rgba(255,255,255,0.10)",
        borderTopWidth: Platform.OS === "ios" ? 0.5 : 1,

        // keep above overlays
        elevation: 100,
        zIndex: 1000,
      },

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