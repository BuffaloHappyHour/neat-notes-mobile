// app/(tabs)/_layout.tsx
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, ViewStyle } from "react-native";

import { colors } from "../../lib/theme";

function DebugTabButton({
  accessibilityState,
  children,
  onLongPress,
  onPress,
  onPressIn,
  style,
  testID,
  accessibilityLabel,
}: BottomTabBarButtonProps) {
  const selected = !!accessibilityState?.selected;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onLongPress={onLongPress}
      onPressIn={(e) => {
        console.log("[TAB PRESS IN]", {
          selected,
          pageX: e.nativeEvent.pageX,
          pageY: e.nativeEvent.pageY,
        });
        onPressIn?.(e);
      }}
      onPress={(e) => {
        console.log("[TAB PRESS]", {
          selected,
          pageX: e.nativeEvent.pageX,
          pageY: e.nativeEvent.pageY,
        });
        onPress?.(e);
      }}
      style={[
        style as ViewStyle,
        {
          borderWidth: 1,
          borderColor: selected
            ? "rgba(190,150,99,0.9)"
            : "rgba(255,255,255,0.25)",
          borderRadius: 12,
          marginHorizontal: 6,
          marginVertical: 6,
          backgroundColor: "rgba(255,0,0,0.06)",
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor:
          colors.textPrimary ?? "rgba(255,255,255,0.55)",
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: "rgba(255,255,255,0.10)",
          borderTopWidth: Platform.OS === "ios" ? 0.5 : 1,
        },
        tabBarButton: (props) => <DebugTabButton {...props} />,
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