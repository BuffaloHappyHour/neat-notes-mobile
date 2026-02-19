// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.divider,
            borderTopWidth: 1,
            elevation: 0, // android shadow off
          },

          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,

          // Helps the bar feel richer/less "flat"
          tabBarItemStyle: {
            paddingTop: 6,
            paddingBottom: 6,
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
    </SafeAreaView>
  );
}
