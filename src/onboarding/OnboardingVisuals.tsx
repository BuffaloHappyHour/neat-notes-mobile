import React from "react";
import { Image, Text, View } from "react-native";

import { RadarChart } from "../profile/insights/components/RadarChart";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { spacing } from "../../lib/spacing";

const DEMO_RADAR_AXES = [
  { key: "sweet",      label: "Sweet",        value: 0.82 },
  { key: "woody",      label: "Woody",        value: 0.74 },
  { key: "spicy",      label: "Spicy",        value: 0.55 },
  { key: "fruity",     label: "Fruity",       value: 0.30 },
  { key: "smoke-peat", label: "Smoke / Peat", value: 0.22 },
  { key: "grainy",     label: "Grainy",       value: 0.45 },
  { key: "nutty",      label: "Nutty",        value: 0.61 },
  { key: "floral",     label: "Floral",       value: 0.18 },
  { key: "earthy",     label: "Earthy",       value: 0.28 },
  { key: "herbal",     label: "Herbal",       value: 0.15 },
  { key: "off-notes",  label: "Off-Notes",    value: 0.08 },
];

const CLARITY_NODES = ["Emerging", "Defining", "Signature"];

export function GlassVisual() {
  return (
    <Image
      source={require("../../assets/images/Glencairn.png")}
      style={{ width: 140, height: 140, alignSelf: "center" }}
      resizeMode="contain"
    />
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
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <RadarChart axes={DEMO_RADAR_AXES} size={280} showLabels={true} />
    </View>
  );
}

export function PicksVisual() {
  return (
    <View style={{ gap: 8, width: "100%", marginBottom: 0 }}>

      {/* Safe Pick card */}
      <View style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: colors.accent + "40",
        borderRadius: 10,
        padding: 10,
        gap: 6,
      }}>
        <View style={{
          backgroundColor: colors.accent + "22",
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
          alignSelf: "flex-start",
        }}>
          <Text style={[type.labelCaps, { color: colors.accent, fontSize: 10 }]}>
            SAFE PICK
          </Text>
        </View>
        <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
          GlenAllachie 12
        </Text>
        <Text style={[type.caption, { color: colors.accent }]}>
          Speyside Single Malt
        </Text>
      </View>

      {/* Stretch Pick card */}
      <View style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: colors.accentPressed + "40",
        borderRadius: 10,
        padding: 10,
        gap: 6,
      }}>
        <View style={{
          backgroundColor: colors.accentPressed + "22",
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
          alignSelf: "flex-start",
        }}>
          <Text style={[type.labelCaps, { color: colors.accentPressed, fontSize: 10 }]}>
            STRETCH PICK
          </Text>
        </View>
        <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
          Ardbeg Uigeadail
        </Text>
        <Text style={[type.caption, { color: colors.accentPressed }]}>
          Islay Single Malt
        </Text>
      </View>

    </View>
  );
}
