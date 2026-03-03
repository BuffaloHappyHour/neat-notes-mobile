import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, {
    Circle,
    G,
    Line,
    Polygon,
    Text as SvgText,
    TSpan,
} from "react-native-svg";

import { colors } from "../../../../lib/theme";
import { fontFamilies } from "../../../../lib/typography";

type Axis = {
  key: string;
  label: string;
  value: number; // 0..1
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function RadarChart({
  axes,
  size = 220,
  levels = 4,
  showLabels = true,
}: {
  axes: Axis[];
  size?: number;
  levels?: number; // number of rings
  showLabels?: boolean;
}) {
  const r = size / 2;
  const center = r;

  // Plot stays the same: calm + premium
  const plotRadius = r * 0.78;

  // Labels sit near the edge so they don't collide with spikes.
  // (We still clamp them inside the view to prevent clipping.)
  const labelRadius = r - 38;

  const safeAxes = useMemo(() => {
    const a = Array.isArray(axes) ? axes : [];
    return a.map((x) => ({ ...x, value: clamp01(x.value) })).slice(0, 12);
  }, [axes]);

  const n = safeAxes.length;

  const angleFor = (i: number) => -Math.PI / 2 + (i * (2 * Math.PI)) / n;

  const toXY = (radius: number, i: number) => {
    const ang = angleFor(i);
    return {
      x: center + radius * Math.cos(ang),
      y: center + radius * Math.sin(ang),
    };
  };

  const ringPolys = useMemo(() => {
    const rings: string[] = [];
    for (let lvl = 1; lvl <= levels; lvl++) {
      const rr = (plotRadius * lvl) / levels;
      const pts = safeAxes
        .map((_, i) => {
          const p = toXY(rr, i);
          return `${p.x},${p.y}`;
        })
        .join(" ");
      rings.push(pts);
    }
    return rings;
  }, [levels, plotRadius, safeAxes, n]);

  const valuePoly = useMemo(() => {
    return safeAxes
      .map((a, i) => {
        const rr = plotRadius * a.value;
        const p = toXY(rr, i);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  }, [plotRadius, safeAxes, n]);

  const axesLines = useMemo(() => {
    return safeAxes.map((_, i) => {
      const p = toXY(plotRadius, i);
      return { i, x2: p.x, y2: p.y };
    });
  }, [plotRadius, safeAxes, n]);

  const labels = useMemo(() => {
    return safeAxes.map((a, i) => {
      const ang = angleFor(i);
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);

      const anchor: "start" | "middle" | "end" =
        cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";

      // Near-edge base position
      const raw = toXY(labelRadius, i);

      // Special-case the very top label to avoid collisions at 12 o'clock
      const isTop = sin < -0.88;
      const topNudge = isTop ? -10 : 0;

      // Clamp inside the circle bounds so nothing clips offscreen
      const padY = isTop ? 6 : 12;
      const padLeft = 22;
      const padRight = 22;

      const padX =
        anchor === "end" ? padLeft : anchor === "start" ? padRight : 18;

      const p = {
        x: Math.max(padX, Math.min(size - padX, raw.x)),
        y: Math.max(padY, Math.min(size - padY, raw.y + topNudge)),
      };

      return { ...a, i, x: p.x, y: p.y, anchor };
    });
  }, [labelRadius, safeAxes, n, size]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: colors.surfaceSunken,
        borderWidth: 1,
        borderColor: colors.accentFaint,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size}>
        <G>
          {/* Center dot */}
          <Circle
            cx={center}
            cy={center}
            r={2.5}
            fill={colors.divider}
            opacity={0.9}
          />

          {/* Rings */}
          {ringPolys.map((pts, idx) => (
            <Polygon
              key={`ring-${idx}`}
              points={pts}
              fill="transparent"
              stroke={colors.divider}
              strokeWidth={1}
              opacity={0.55}
            />
          ))}

          {/* Spokes */}
          {axesLines.map((l) => (
            <Line
              key={`spoke-${l.i}`}
              x1={center}
              y1={center}
              x2={l.x2}
              y2={l.y2}
              stroke={colors.divider}
              strokeWidth={1}
              opacity={0.45}
            />
          ))}

          {/* Value polygon */}
          <Polygon
            points={valuePoly}
            fill={colors.accentSoft}
            stroke={colors.accent}
            strokeWidth={2}
            opacity={0.95}
          />

          {/* Labels */}
          {showLabels &&
            labels.map((l) => {
              const parts = l.label
                .split("/")
                .map((s) => s.trim())
                .filter(Boolean);

              // One-line label
              if (parts.length <= 1) {
                return (
                  <SvgText
                    key={`lbl-${l.key}`}
                    x={l.x}
                    y={l.y}
                    fontSize={12}
                    fill={colors.textSecondary}
                    opacity={0.95}
                    textAnchor={l.anchor}
                    alignmentBaseline="middle"
                    fontFamily={fontFamilies.bodyMedium}
                  >
                    {l.label}
                  </SvgText>
                );
              }

              // Two-line label (center block on y)
              return (
                <SvgText
                  key={`lbl-${l.key}`}
                  x={l.x}
                  y={l.y}
                  fontSize={12}
                  fill={colors.textSecondary}
                  opacity={0.95}
                  textAnchor={l.anchor}
                  alignmentBaseline="middle"
                  fontFamily={fontFamilies.bodyMedium}
                >
                  <TSpan x={l.x} dy={-6}>
                    {parts[0]}
                  </TSpan>
                  <TSpan x={l.x} dy={12}>
                    {parts[1]}
                  </TSpan>
                </SvgText>
              );
            })}
        </G>
      </Svg>
    </View>
  );
}