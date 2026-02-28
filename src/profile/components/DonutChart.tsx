// src/profile/components/DonutChart.tsx
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type DonutRow = {
  label: string;
  pct: number; // 0..1 (or any positive numbers; we normalize)
  alpha: number; // 0..1
};

export function DonutChart({
  rows,
  size = 148,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  rows?: DonutRow[] | null; // ✅ allow runtime undefined/null
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  const safeRows = useMemo(() => {
    const input = Array.isArray(rows) ? rows : [];

    const filtered = input
      .filter((x) => x && Number.isFinite(x.pct) && x.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    const sum = filtered.reduce((acc, x) => acc + x.pct, 0);
    if (!Number.isFinite(sum) || sum <= 0) return [];

    // Normalize so it always totals 1.0
    return filtered.map((x) => ({
      ...x,
      pct: x.pct / sum,
      alpha: Number.isFinite(x.alpha) ? x.alpha : 0.7,
    }));
  }, [rows]);

  // Start at top (12 o’clock)
  const rotation = -90;

  // Nothing to draw? Show just the center text.
  const shouldDraw = safeRows.length > 0 && Number.isFinite(c) && c > 0;

  let offset = 0;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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
          {shouldDraw
            ? safeRows.map((seg, idx) => {
                const dash = seg.pct * c;
                const gap = c - dash;

                // ✅ Safe color handling (won't produce NaN rgba)
                const base = typeof colors.accent === "string" ? colors.accent : "#ffffff";
                const stroke = rgbaSafe(base, clamp(seg.alpha, 0.18, 0.95));

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
              })
            : null}
        </G>
      </Svg>

      {/* Center text */}
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        {centerLabel ? (
          <Text
            style={[
              (type.labelCaps ?? type.body) as any,
              { opacity: 0.85, color: colors.textSecondary },
            ]}
          >
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

/**
 * ✅ rgbaSafe:
 * - If input is already rgb/rgba/hsl/hsla -> return as-is (ignores alpha)
 * - If input is hex -> convert to rgba with alpha
 * - If input is anything else -> return as-is (best-effort, non-crashing)
 */
function rgbaSafe(color: string, a: number) {
  const s = String(color ?? "").trim();
  if (!s) return `rgba(255, 255, 255, ${a})`;

  const lower = s.toLowerCase();
  if (lower.startsWith("rgba(") || lower.startsWith("rgb(")) return s;
  if (lower.startsWith("hsl(") || lower.startsWith("hsla(")) return s;

  // hex: #rgb or #rrggbb
  if (!s.startsWith("#")) return s;

  const h = s.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return s;

  const num = parseInt(full, 16);
  if (!Number.isFinite(num)) return s;

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}