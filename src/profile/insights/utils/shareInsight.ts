import { Share } from "react-native";

export async function shareInsight(message: string) {
  await Share.share({ message });
}