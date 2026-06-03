import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../../lib/radii";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";

type StatItem = {
  label: string;
  value: string;
};

type MiniBarDatum = {
  label: string;
  value: number; // 0..1
  tastingId?: string;
};

function SectionSubheader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={[type.body, { fontWeight: "900", fontSize: 18 }]}>{title}</Text>
      <Text style={[type.microcopyItalic, { opacity: 0.82 }]}>{subtitle}</Text>
    </View>
  );
}

function StatRow({ label, value }: StatItem) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      <Text style={[type.caption, { flex: 1 }]}>{label}</Text>
      <Text style={[type.caption, { fontWeight: "900" }]}>{value}</Text>
    </View>
  );
}

function ProgressTrack({
  value,
  label,
  valueText,
}: {
  value: number;
  label: string;
  valueText: string;
}) {
  const safe = Math.max(0, Math.min(1, value));

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <Text style={type.caption}>{label}</Text>
        <Text style={[type.caption, { fontWeight: "900" }]}>{valueText}</Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: colors.accentFaint,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <View
          style={{
            width: `${Math.round(safe * 100)}%`,
            height: "100%",
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.9,
          }}
        />
      </View>
    </View>
  );
}

function ChipRow({
  title,
  chips,
}: {
  title: string;
  chips: string[];
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[type.caption, { opacity: 0.78 }]}>{title}</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {chips.map((chip) => (
          <View
            key={chip}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surfaceSunken,
            }}
          >
            <Text style={[type.caption, { fontWeight: "800" }]}>{chip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MiniColumnChart({
  title,
  data,
}: {
  title: string;
  data: MiniBarDatum[];
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[type.caption, { opacity: 0.78 }]}>{title}</Text>

      <View
        style={{
          height: 132,
          paddingTop: 10,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        {data.map((item) => {
          const height = Math.max(14, item.value * 82);

          return (
            <View
              key={`${item.label}-${item.tastingId ?? "no-id"}`}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text
                style={[
                  type.caption,
                  {
                    fontSize: 11,
                    opacity: 0.8,
                    fontWeight: "700",
                  },
                ]}
              >
                {(item.value * 5).toFixed(1)}
              </Text>

              <View
                style={{
                  width: "100%",
                  height,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                  opacity: 0.85,
                }}
              />

              {item.tastingId ? (
  <Pressable
    onPress={() =>
      router.push({
        pathname: "/log/cloud-tasting",
        params: { tastingId: item.tastingId },
      } as any)
    }
    style={({ pressed }) => ({
      opacity: pressed ? 0.75 : 1,
      maxWidth: "100%",
      minHeight: 26,
      justifyContent: "flex-start",
    })}
  >
    <Text
      style={[
        type.caption,
        {
          fontSize: 10,
          lineHeight: 12,
          opacity: 0.82,
          color: colors.accent,
          textAlign: "center",
          textDecorationLine: "underline",
          minHeight: 26,
        },
      ]}
      numberOfLines={2}
    >
      {item.label}
    </Text>
  </Pressable>
) : (
  <Text
    style={[
      type.caption,
      {
        fontSize: 10,
        lineHeight: 12,
        opacity: 0.6,
        color: colors.textSecondary,
        textAlign: "center",
        minHeight: 26,
      },
    ]}
    numberOfLines={2}
  >
    {item.label}
  </Text>
)}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ClarityDriverDashboard({
  title,
  subtitle,
  stats,
  progressLabel,
  progressValue,
  progressValueText,
  chipsTitle,
  chips,
  miniChartTitle,
  miniChartData,
  footerLabel,
  footerValue,
}: {
  title: string;
  subtitle: string;
  stats: StatItem[];
  progressLabel: string;
  progressValue: number;
  progressValueText: string;
  chipsTitle: string;
  chips: string[];
  miniChartTitle: string;
  miniChartData: MiniBarDatum[];
  footerLabel: string;
  footerValue: string;
}) {
  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radii.xl,
        backgroundColor: colors.surfaceSunken,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        gap: spacing.md,
      }}
    >
      <SectionSubheader title={title} subtitle={subtitle} />

      <View style={{ gap: spacing.sm }}>
        {stats.map((row) => (
          <StatRow key={`${title}-${row.label}`} label={row.label} value={row.value} />
        ))}
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.borderSubtle,
          opacity: 0.7,
        }}
      />

      <ProgressTrack
        label={progressLabel}
        value={progressValue}
        valueText={progressValueText}
      />

      <ChipRow title={chipsTitle} chips={chips} />

      <MiniColumnChart title={miniChartTitle} data={miniChartData} />

      <View
        style={{
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          gap: 6,
        }}
      >
        <Text style={[type.caption, { opacity: 0.78 }]}>{footerLabel}</Text>
        <Text style={[type.body, { fontWeight: "800" }]}>{footerValue}</Text>
      </View>
    </View>
  );
}