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

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    const platform: "ios" | "android" =
      Platform.OS === "ios" ? "ios" : "android";

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return null;

    await supabase.from("user_push_tokens").upsert(
      {
        user_id: userId,
        token: token.data,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return token.data;
  } catch {
    return null;
  }
}
