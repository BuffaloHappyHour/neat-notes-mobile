// src/log/components/tasting/BottleDetailsCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
    Animated,
    LayoutAnimation,
    Platform,
    Pressable,
    Text,
    UIManager,
    View,
} from "react-native";

import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type DetailRow = { label: string; value: string };

type Props = {
  title?: string;
  subtitle?: string;
  detailsLabel?: string;
  rows: DetailRow[];
  defaultOpen?: boolean;

  /**
   * Optional: if you ever want to hide the top divider in certain contexts.
   * Defaults to true.
   */
  showTopDivider?: boolean;
};

export function BottleDetailsCard({
  title,
  subtitle,
  detailsLabel = "Bottle details",
  rows,
  defaultOpen = false,
  showTopDivider = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const visibleRows = useMemo(
    () => rows.filter((r) => String(r.value ?? "").trim()),
    [rows]
  );

  // Animated chevron rotation (0 = closed, 1 = open)
  const rot = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setOpen((prev) => {
      const next = !prev;
      Animated.timing(rot, {
        toValue: next ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }

  if (!visibleRows.length) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Optional divider ABOVE the section (matches your render vibe) */}
      {showTopDivider ? (
        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            opacity: 0.9,
            marginTop: spacing.xs,
          }}
        />
      ) : null}

      {/* Optional title/subtitle (rarely used since whiskey name is the hero) */}
      {title ? <Text style={type.sectionHeader}>{title}</Text> : null}
      {subtitle ? (
        <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.82 }]}>
          {subtitle}
        </Text>
      ) : null}

      {/* Header row (NO inner slab, NO gold nub) */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: spacing.sm + 2,
          opacity: pressed ? 0.92 : 1,
        })}
        hitSlop={10}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={colors.accent} />
        </Animated.View>

        <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]}>
          {detailsLabel}
        </Text>
      </Pressable>

      {/* Divider under header when open */}
      {open ? (
        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            opacity: 0.75,
            marginTop: 2,
          }}
        />
      ) : null}

      {/* Expanded content */}
      {open ? (
        <View style={{ gap: spacing.xs + 2, paddingTop: spacing.xs }}>
          {visibleRows.map((r) => (
            <View
              key={r.label}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <Text style={[type.microcopyItalic, { opacity: 0.7 }]}>{r.label}</Text>

              <Text
                style={[
                  type.body,
                  {
                    opacity: 0.96,
                    flexShrink: 1,
                    textAlign: "right",
                    fontWeight: "800",
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {r.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}