// src/profile/components/DonutChart.tsx
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type DonutRow = {
  label: string;
  pct: number;   // 0..1
  alpha: number; // 0..1
};

export function DonutChart({
  rows,
  size = 148,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  rows: DonutRow[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  const safeRows = useMemo(() => {
    const filtered = rows
      .filter((x) => Number.isFinite(x.pct) && x.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    const sum = filtered.reduce((acc, x) => acc + x.pct, 0);
    if (sum <= 0) return [];

    // Normalize so it always totals 1.0
    return filtered.map((x) => ({ ...x, pct: x.pct / sum }));
  }, [rows]);

  // Start at top (12 o’clock)
  const rotation = -90;

  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G rotation={rotation} originX={size / 2} originY={size / 2}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.divider}
            strokeWidth={thickness}
            fill="transparent"
            opacity={0.9}
          />

          {/* Segments */}
          {safeRows.map((seg, idx) => {
            const dash = seg.pct * c;
            const gap = c - dash;

            const stroke = rgba(colors.accent, clamp(seg.alpha, 0.18, 0.95));

            const el = (
              <Circle
                key={`${seg.label}-${idx}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={stroke}
                strokeWidth={thickness}
                strokeLinecap="butt"
                fill="transparent"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
              />
            );

            offset += dash;
            return el;
          })}
        </G>
      </Svg>

      {/* Center text */}
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        {centerLabel ? (
          <Text style={[type.labelCaps ?? type.body, { opacity: 0.85, color: colors.textSecondary }]}>
            {centerLabel}
          </Text>
        ) : null}
        {centerValue ? (
          <Text style={[type.sectionHeader, { marginTop: 4, color: colors.textPrimary }]}>
            {centerValue}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}