// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { colors } from "../../lib/theme";

type TabKey = "home" | "discover" | "log" | "profile";

function DebugTabButton({
  tabKey,
  children,
  onPress,
  onLongPress,
  accessibilityState,
  testID,
  accessibilityLabel,
  pressCount,
  bumpCount,
}: any & {
  tabKey: TabKey;
  pressCount: number;
  bumpCount: () => void;
}) {
  // When selected, iOS sometimes uses accessibilityState.selected
  const selected = !!accessibilityState?.selected;

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onLongPress={onLongPress}
      onPress={(e) => {
        console.log(`[TAB_PRESS] ${tabKey} selected=${selected} t=${Date.now()}`);
        bumpCount();
        onPress?.(e);
      }}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 18 : 10,
        opacity: pressed ? 0.7 : 1,
      })}
      hitSlop={10}
    >
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {children}

        {/* Tiny counter badge: proves onPress ran */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -6,
            right: -14,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 4,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: colors.surface,
            opacity: 0.9,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "900",
              color: colors.textPrimary,
            }}
          >
            {pressCount}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const [counts, setCounts] = useState<Record<TabKey, number>>({
    home: 0,
    discover: 0,
    log: 0,
    profile: 0,
  });

  const bump = (k: TabKey) =>
    setCounts((prev) => ({ ...prev, [k]: (prev[k] ?? 0) + 1 }));

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textPrimary ?? "rgba(255,255,255,0.55)",
      tabBarLabelStyle: { fontSize: 11 },
      tabBarStyle: {
        backgroundColor: colors.background, // not transparent
        borderTopColor: "rgba(255,255,255,0.10)",
        borderTopWidth: Platform.OS === "ios" ? 0.5 : 1,
      },
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
          tabBarButton: (props) => (
            <DebugTabButton
              {...props}
              tabKey="home"
              pressCount={counts.home}
              bumpCount={() => bump("home")}
            />
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
          tabBarButton: (props) => (
            <DebugTabButton
              {...props}
              tabKey="discover"
              pressCount={counts.discover}
              bumpCount={() => bump("discover")}
            />
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
          tabBarButton: (props) => (
            <DebugTabButton
              {...props}
              tabKey="log"
              pressCount={counts.log}
              bumpCount={() => bump("log")}
            />
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
          tabBarButton: (props) => (
            <DebugTabButton
              {...props}
              tabKey="profile"
              pressCount={counts.profile}
              bumpCount={() => bump("profile")}
            />
          ),
        }}
      />
    </Tabs>
  );
}