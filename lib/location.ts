import * as Location from "expo-location";
import { Platform } from "react-native";

import { supabase } from "./supabase";

export type LocationPermissionResult =
  | { status: "granted" }
  | { status: "denied" }
  | { status: "unavailable" };

export type ApproximateLocation = {
  city: string | null;
  state: string | null;
  country: string;
};

export async function canAskForLocation(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === Location.PermissionStatus.UNDETERMINED;
}

export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus === Location.PermissionStatus.UNDETERMINED) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === Location.PermissionStatus.GRANTED) {
      return { status: "granted" };
    }

    return { status: "denied" };
  } catch (error) {
    console.error("Location permission request failed:", error);
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("analytics_events").insert({
        user_id: userData?.user?.id ?? "00000000-0000-0000-0000-000000000000",
        event_name: "location_permission_failed",
        properties: { message: String(error), platform: Platform.OS },
      });
    } catch {}
    return { status: "unavailable" };
  }
}

export async function getApproximateLocation(): Promise<ApproximateLocation | null> {
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    const results = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (!results.length) return null;

    const place = results[0];
    const country = place.country ?? place.isoCountryCode;
    if (!country) return null;

    return {
      city: place.city ?? null,
      state: place.region ?? null,
      country,
    };
  } catch (error) {
    console.error("getApproximateLocation failed:", error);
    return null;
  }
}
