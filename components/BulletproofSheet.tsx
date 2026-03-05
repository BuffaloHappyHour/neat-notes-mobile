import React from "react";
import type { ViewStyle } from "react-native";

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  containerStyle?: ViewStyle;
};

// DEBUG BUILD: disable all sheet behavior to eliminate iOS touch interception variables.
export function BulletproofSheet(_props: Props) {
  return null;
}