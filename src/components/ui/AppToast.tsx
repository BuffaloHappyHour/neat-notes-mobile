import React, { useEffect } from "react";
import { Animated, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type AppToastProps = {
  visible: boolean;
  title: string;
  message?: string;
  onHide: () => void;
  duration?: number;
};

export function AppToast({
  visible,
  title,
  message,
  onHide,
  duration = 2600,
}: AppToastProps) {
  const [translateY] = React.useState(new Animated.Value(120));
  const [opacity] = React.useState(new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 120,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
  <Animated.View
    pointerEvents="none"
    style={{
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      bottom: spacing.lg,
      opacity,
      transform: [{ translateY }],
    }}
  >
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.accent,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        ...shadows.card,
      }}
    >
      <Text style={[type.button, { color: colors.textPrimary }]}>
        {title}
      </Text>

      {message ? (
        <Text
          style={[
            type.microcopyItalic,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  </Animated.View>
);
}