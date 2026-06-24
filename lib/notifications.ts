import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushRegistrationResult =
  | { status: "registered"; token: string }
  | { status: "denied" }
  | { status: "unavailable" };

export async function canAskForPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "undetermined";
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  try {
    if (!Device.isDevice) {
      return { status: "unavailable" };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus === "undetermined") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return { status: "denied" };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    const platform: "ios" | "android" =
      Platform.OS === "ios" ? "ios" : "android";

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { status: "unavailable" };

    const { error: upsertError } = await supabase.from("user_push_tokens").upsert(
      {
        user_id: userId,
        token: token.data,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (upsertError) {
      console.error("Failed to save push token:", upsertError);
      await supabase.from("analytics_events").insert({
        user_id: userId,
        event_name: "push_token_error",
        properties: { message: upsertError.message, code: upsertError.code },
      });
    }

    return { status: "registered", token: token.data };
  } catch (error) {
    console.error("Push token registration failed:", error);
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("analytics_events").insert({
        user_id: userData?.user?.id ?? "00000000-0000-0000-0000-000000000000",
        event_name: "push_token_registration_failed",
        properties: { message: String(error), platform: Platform.OS },
      });
    } catch {}
    return { status: "unavailable" };
  }
}
