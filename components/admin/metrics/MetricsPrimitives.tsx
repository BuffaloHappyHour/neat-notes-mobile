import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { getStatusColor, type MetricStatus } from "./formatters";

type ThresholdItem = {
  label: string;
  value: string;
  tone?: MetricStatus;
};

function ThresholdModal({
  visible,
  title,
  description,
  items,
  onClose,
}: {
  visible: boolean;
  title: string;
  description?: string;
  items: ThresholdItem[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          padding: spacing.lg,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            padding: spacing.lg,
            gap: spacing.md,
            ...shadows.card,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <Text style={[type.sectionHeader, { color: colors.textPrimary, flex: 1 }]}>
              {title}
            </Text>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: colors.background,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Ionicons name="close" size={16} color={colors.textPrimary} />
            </Pressable>
          </View>

          {description ? (
            <Text
              style={[
                type.microcopyItalic,
                {
                  color: colors.textSecondary,
                  fontSize: 12,
                  lineHeight: 17,
                },
              ]}
            >
              {description}
            </Text>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            {items.map((item, index) => {
              const toneColor = getStatusColor(item.tone ?? "neutral");

              return (
                <View
                  key={`${item.label}-${index}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.md,
                    paddingVertical: 8,
                    borderBottomWidth: index === items.length - 1 ? 0 : 1,
                    borderBottomColor: colors.divider,
                  }}
                >
                  <Text
                    style={[
                      type.body,
                      {
                        color: colors.textSecondary,
                        flex: 1,
                        fontSize: 14,
                        lineHeight: 18,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>

                  <Text
                    style={[
                      type.body,
                      {
                        color: toneColor,
                        fontWeight: "900",
                        fontSize: 14,
                        lineHeight: 18,
                      },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </View>
    </Modal>
  );
}

export function MetricsCard({
  title,
  children,
  right,
  insight,
  thresholdTitle,
  thresholdDescription,
  thresholdItems,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  insight?: string;
  thresholdTitle?: string;
  thresholdDescription?: string;
  thresholdItems?: ThresholdItem[];
}) {
  const [open, setOpen] = useState(false);
  const hasThresholds = Array.isArray(thresholdItems) && thresholdItems.length > 0;

  return (
    <>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.divider,
          ...shadows.card,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 }}>
            <Text style={[type.sectionHeader, { color: colors.textPrimary, flexShrink: 1 }]}>
              {title}
            </Text>

            {hasThresholds ? (
              <Pressable
                onPress={() => setOpen(true)}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: colors.background,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={colors.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>

          {right ? right : null}
        </View>

        {insight ? (
          <Text
            style={[
              type.microcopyItalic,
              {
                color: colors.textSecondary,
                fontSize: 12,
                lineHeight: 17,
              },
            ]}
          >
            {insight}
          </Text>
        ) : null}

        {children}
      </View>

      {hasThresholds ? (
        <ThresholdModal
          visible={open}
          title={thresholdTitle ?? `${title} thresholds`}
          description={thresholdDescription}
          items={thresholdItems!}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function HeroStat({
  label,
  value,
  subtitle,
  status = "neutral",
}: {
  label: string;
  value: string;
  subtitle?: string;
  status?: MetricStatus;
}) {
  const accent = getStatusColor(status);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1.5,
        borderColor: accent,
        ...shadows.card,
        gap: spacing.xs,
      }}
    >
      <Text
        style={[
          type.microcopyItalic,
          {
            color: colors.textSecondary,
            fontSize: 12,
            lineHeight: 16,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.sectionHeader,
          {
            color: colors.textPrimary,
            fontSize: 30,
            lineHeight: 34,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {subtitle ? (
        <Text
          style={[
            type.microcopyItalic,
            {
              color: colors.textSecondary,
              fontSize: 12,
              lineHeight: 16,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function MetricRow({
  label,
  value,
  status = "neutral",
}: {
  label: string;
  value: string;
  status?: MetricStatus;
}) {
  const accent = getStatusColor(status);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
      }}
    >
      <Text
        style={[
          type.body,
          {
            flex: 1,
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 18,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.body,
          {
            color: accent,
            fontSize: 14,
            lineHeight: 18,
            fontWeight: "900",
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function MetricRowNoDivider({
  label,
  value,
  status = "neutral",
}: {
  label: string;
  value: string;
  status?: MetricStatus;
}) {
  const accent = getStatusColor(status);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: 6,
      }}
    >
      <Text
        style={[
          type.body,
          {
            flex: 1,
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 18,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.body,
          {
            color: accent,
            fontSize: 14,
            lineHeight: 18,
            fontWeight: "900",
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: colors.background,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.divider,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        gap: 6,
      }}
    >
      <Text
        style={[
          type.microcopyItalic,
          {
            color: colors.textSecondary,
            opacity: 0.9,
            fontSize: 12,
            lineHeight: 16,
            textAlign: "center",
            minHeight: 32,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          type.sectionHeader,
          {
            color: colors.textPrimary,
            fontSize: 24,
            lineHeight: 28,
            textAlign: "center",
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.divider,
        backgroundColor: active ? colors.surface : "transparent",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text
        style={[
          type.button,
          {
            fontSize: 13,
            lineHeight: 16,
            color: active ? colors.textPrimary : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}