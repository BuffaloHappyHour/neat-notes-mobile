import AsyncStorage from "@react-native-async-storage/async-storage";

const ACTIVE_EVENT_ID_KEY = "active_event_id";

export async function getActiveEventId(): Promise<string | null> {
  const value = await AsyncStorage.getItem(ACTIVE_EVENT_ID_KEY);
  return value?.trim() || null;
}

export async function setActiveEventId(eventId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_EVENT_ID_KEY, eventId);
}

export async function clearActiveEventId(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_EVENT_ID_KEY);
}