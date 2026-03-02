// app/(tabs)/_layout.tsx
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

import { colors } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <NativeTabs
      // Selected icon/label color
      tintColor={colors.accent}
      // Label styling (best-effort; native tabs still control some styling)
      labelStyle={{
  fontSize: 11,
}}
    >
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon
          sf={{ default: "house", selected: "house.fill" }}
        
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover" role="search">
        <Label>Discover</Label>
        <Icon
          sf={{ default: "magnifyingglass", selected: "magnifyingglass" }}
         
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="log">
        <Label>Log</Label>
        <Icon
          sf={{ default: "square.and.pencil", selected: "square.and.pencil" }}
        
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon
          sf={{ default: "person", selected: "person.fill" }}
     
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}