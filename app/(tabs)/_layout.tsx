// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

function DebugTabButton(props: any) {
  // props includes: onPress, accessibilityState, children, style, etc.
  const selected = !!props?.accessibilityState?.selected;

  return (
    <Pressable
      {...props}
      onPress={(e) => {
        console.log("[TAB PRESS]", {
          selected,
          // @ts-ignore
          pageX: e?.nativeEvent?.pageX,
          // @ts-ignore
          pageY: e?.nativeEvent?.pageY,
        });
        props?.onPress?.(e);
      }}
      style={({ pressed }) => [
        props.style,
        {
          // Visualize the *actual* hitbox
          borderWidth: 1,
          borderColor: selected ? "rgba(190,150,99,0.9)" : "rgba(255,255,255,0.25)",
          borderRadius: 12,
          marginHorizontal: 6,
          marginVertical: 6,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {props.children}
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textPrimary ?? "rgba(255,255,255,0.55)",
        tabBarLabelStyle: {
          fontSize: 11,
          // IMPORTANT: remove custom font for this test
          // fontFamily: type?.body?.fontFamily,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: "rgba(255,255,255,0.10)",
          borderTopWidth: Platform.OS === "ios" ? 0.5 : 1,
        },

        // ✅ The whole point of this build:
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