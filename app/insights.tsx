import { Stack } from "expo-router";
import React from "react";

import InsightsScreen from "../src/profile/insights/InsightsScreen";

export default function InsightsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Insights" }} />
      <InsightsScreen />
    </>
  );
}