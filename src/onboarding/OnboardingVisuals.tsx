import React from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { RadarChart } from "../profile/insights/components/RadarChart";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { spacing } from "../../lib/spacing";

const DEMO_RADAR_AXES = [
  { key: "sweet",      label: "Sweet",       value: 0.82 },
  { key: "woody",      label: "Woody",       value: 0.74 },
  { key: "spicy",      label: "Spicy",       value: 0.45 },
  { key: "fruity",     label: "Fruity",      value: 0.38 },
  { key: "smoke-peat", label: "Smoke / Peat", value: 0.29 },
  { key: "nutty",      label: "Nutty",       value: 0.61 },
  { key: "grainy",     label: "Grainy",      value: 0.55 },
  { key: "floral",     label: "Floral",      value: 0.22 },
  { key: "earthy",     label: "Earthy",      value: 0.33 },
  { key: "herbal",     label: "Herbal",      value: 0.18 },
  { key: "off-notes",  label: "Off-Notes",   value: 0.08 },
];

const CLARITY_NODES = ["Emerging", "Defining", "Signature"];

export function GlassVisual() {
  return (
    <View style={{ alignSelf: "center" }}>
      <Svg width={120} height={160} viewBox="0 0 120 160">
        <Path
          d="M 25,15 L 95,15 L 85,125 L 35,125 Z"
          stroke={colors.accent}
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function ClarityVisual() {
  return (
    <View style={{ alignItems: "center", width: "100%" }}>
      {/* Big number + label */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: spacing.lg }}>
        <Text style={[type.heroMetric, { color: colors.accent }]}>58</Text>
        <Text style={[type.labelCaps, { color: colors.textSecondary }]}>clarity</Text>
      </View>

      {/* 3-node progression */}
      <View style={{ width: "100%", paddingHorizontal: spacing.lg }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            height: 18,
          }}
        >
          {/* Connector */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: colors.borderStrong,
              top: 8,
              zIndex: 0,
            }}
          />
          {/* Nodes */}
          {CLARITY_NODES.map((label, i) => {
            const size = i === 2 ? 18 : 12;
            return (
              <View
                key={label}
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: colors.accent,
                  zIndex: 1,
                  ...(i === 2
                    ? {
                        shadowColor: colors.accent,
                        shadowOpacity: 0.65,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 6,
                      }
                    : {}),
                }}
              />
            );
          })}
        </View>

        {/* Labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          {CLARITY_NODES.map((label, i) => (
            <Text
              key={label}
              style={[
                type.caption,
                {
                  flex: 1,
                  textAlign: "center",
                  color: i === 2 ? colors.accent : colors.textMuted,
                  fontWeight: i === 2 ? "700" : undefined,
                },
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export function RadarVisual() {
  return (
    <View style={{ alignItems: "center" }}>
      <RadarChart axes={DEMO_RADAR_AXES} size={200} showLabels={true} />
    </View>
  );
}

export function IconsVisual() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        paddingHorizontal: spacing.lg,
      }}
    >
      {/* Bottle */}
      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <Svg width={40} height={60} viewBox="0 0 40 60">
          <Path
            d="M 16,0 L 24,0 L 24,16 L 32,24 L 32,58 L 8,58 L 8,24 L 16,16 Z"
            stroke={colors.accent}
            strokeWidth={1.5}
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={[type.caption, { color: colors.textSecondary, textAlign: "center" }]}>
          Recommendations
        </Text>
      </View>

      {/* Calendar */}
      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <Svg width={44} height={44} viewBox="0 0 44 44">
          <Path
            d={[
              "M 2,8 L 42,8 L 42,42 L 2,42 Z",
              "M 2,18 L 42,18",
              "M 15,18 L 15,42",
              "M 29,18 L 29,42",
              "M 2,28 L 42,28",
              "M 2,38 L 42,38",
              "M 13,4 L 13,12",
              "M 31,4 L 31,12",
            ].join(" ")}
            stroke={colors.accent}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
        <Text style={[type.caption, { color: colors.textSecondary, textAlign: "center" }]}>
          Events
        </Text>
      </View>

      {/* Pin */}
      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <Svg width={36} height={50} viewBox="0 0 36 50">
          <Path
            d="M 18,48 C 10,36 4,28 4,18 C 4,8 11,2 18,2 C 25,2 32,8 32,18 C 32,28 26,36 18,48 Z"
            stroke={colors.accent}
            strokeWidth={1.5}
            fill="none"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={[type.caption, { color: colors.textSecondary, textAlign: "center" }]}>
          Venues
        </Text>
      </View>
    </View>
  );
}
