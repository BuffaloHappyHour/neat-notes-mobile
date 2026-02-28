// src/log/components/tasting/RatingSection.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

/**
 * Expo-Go-safe slider (pure JS) so we don't depend on native slider modules.
 * Goals:
 * - tighter vertical rhythm
 * - − / slider / + on one line
 * - slider feels centered (no droop)
 * - slider slightly shorter than full width
 */
function SimpleSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  onSlidingChange,
  trackWidthPct = 0.92,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onSlidingChange?: (sliding: boolean) => void;
  trackWidthPct?: number;
}) {
  const trackRef = useRef<View>(null);

  const [trackW, setTrackW] = useState(0);
  const [trackX, setTrackX] = useState(0);

  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<number | null>(null);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const snap = (n: number) => {
    const s = step <= 0 ? 1 : step;
    return Math.round(n / s) * s;
  };

  function measureTrackX() {
    const node = trackRef.current as any;
    if (!node?.measureInWindow) return;
    node.measureInWindow((x: number) => {
      if (Number.isFinite(x)) setTrackX(x);
    });
  }

  function flushPending() {
    if (pendingRef.current == null) return;
    const v = pendingRef.current;
    pendingRef.current = null;
    onValueChange(v);
  }

  function scheduleValue(next: number) {
    pendingRef.current = next;
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      flushPending();
    });
  }

  function xToValue(pageX: number) {
    if (trackW <= 0) return clamp(snap(value));
    const localX = pageX - trackX;
    const t = Math.max(0, Math.min(1, localX / trackW));
    const raw = min + t * (max - min);
    return clamp(snap(raw));
  }

  function handleTouch(evt: any) {
    if (disabled) return;
    const pageX = Number(evt?.nativeEvent?.pageX ?? 0);
    scheduleValue(xToValue(pageX));
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponder: (_evt, gesture) => {
          if (disabled) return false;
          const dx = Math.abs(gesture.dx);
          const dy = Math.abs(gesture.dy);
          return dx > 2 && dx > dy;
        },
        onMoveShouldSetPanResponderCapture: (_evt, gesture) => {
          if (disabled) return false;
          const dx = Math.abs(gesture.dx);
          const dy = Math.abs(gesture.dy);
          return dx > 2 && dx > dy;
        },
        onPanResponderGrant: (evt) => {
          measureTrackX();
          onSlidingChange?.(true);
          handleTouch(evt);
        },
        onPanResponderMove: (evt) => handleTouch(evt),
        onPanResponderRelease: () => onSlidingChange?.(false),
        onPanResponderTerminate: () => onSlidingChange?.(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, trackW, trackX, value, min, max, step]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const pct = max === min ? 0 : ((clamp(value) - min) / (max - min)) * 100;

  const THUMB = 22;
  const thumbLeft = useMemo(() => {
    if (trackW <= 0) return 0;
    const raw = (trackW * pct) / 100 - THUMB / 2;
    return Math.max(0, Math.min(trackW - THUMB, raw));
  }, [trackW, pct]);

  return (
    <View style={{ alignItems: "center" }}>
      <View
        ref={trackRef}
        onLayout={(e) => {
          setTrackW(e.nativeEvent.layout.width);
          setTimeout(() => measureTrackX(), 0);
        }}
        style={{
          width: `${Math.max(0.6, Math.min(1, trackWidthPct)) * 100}%`,
          height: 26, // ✅ optical centering
          justifyContent: "center",
          opacity: disabled ? 0.55 : 1,
        }}
        {...pan.panHandlers}
      >
        <View
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: colors.divider,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: colors.accent,
            }}
          />
        </View>

        <View
          style={{
            position: "absolute",
            left: thumbLeft,
            width: THUMB,
            height: THUMB,
            borderRadius: 999,
            backgroundColor: colors.accent,
            borderWidth: 2,
            borderColor: colors.surface,
          }}
        />
      </View>
    </View>
  );
}

type Props = {
  locked: boolean;
  rating: number | null;
  setRating: React.Dispatch<React.SetStateAction<number | null>>;
  onSlidingChange?: (sliding: boolean) => void;
};

export default function RatingSection({ locked, rating, setRating, onSlidingChange }: Props) {
  const repeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDraggingRef = useRef(false);

  const v = useMemo(() => clamp100(rating == null ? 0 : Number(rating)), [rating]);

  function stepRating(delta: number) {
    if (locked) return;
    if (isDraggingRef.current) return;

    setRating((prev) => {
      const base = prev == null ? 0 : Number(prev);
      return clamp100(Math.round(base + delta));
    });
  }

  function stopRepeat() {
    if (repeatTimerRef.current) clearInterval(repeatTimerRef.current);
    repeatTimerRef.current = null;
  }

  function startRepeat(delta: number) {
    if (locked) return;
    if (isDraggingRef.current) return;

    stopRepeat();
    stepRating(delta);
    repeatTimerRef.current = setInterval(() => stepRating(delta), 80);
  }

  useEffect(() => {
    return () => stopRepeat();
  }, []);

  return (
    <View style={{ gap: spacing.xs + 2 }}>
      <Text style={[type.sectionHeader, { fontSize: 22},{ marginBottom: 0 }]}>Rating</Text>
      <Text style={[type.microcopyItalic, { marginTop: 0, opacity: 1 }]}>
        Drag the bar for big moves. Press + / − to refine (hold for fast).
      </Text>

      <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>
        <Text
          style={{
            fontSize: 54,
            lineHeight: 58,
            fontWeight: "900",
            textAlign: "center",
            color: colors.textPrimary,
            fontFamily: type.screenTitle?.fontFamily ?? type.body.fontFamily,
            opacity: rating == null ? 0.35 : 1,
          }}
        >
          {rating == null ? "—" : String(Math.round(v))}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Pressable
            onPress={() => stepRating(-1)}
            onPressIn={() => startRepeat(-1)}
            onPressOut={stopRepeat}
            disabled={locked}
            style={({ pressed }) => ({
              width: 46,
              height: 46,
              borderRadius: radii.md,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: pressed ? colors.highlight : "rgba(255,255,255,0.03)",
              opacity: locked ? 0.5 : 1,
            })}
          >
            <Text style={[type.button, { fontSize: 22, color: colors.textPrimary }]}>−</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <SimpleSlider
              disabled={locked}
              value={v}
              min={0}
              max={100}
              step={1}
              onSlidingChange={(s: boolean) => {
                isDraggingRef.current = s;
                onSlidingChange?.(s);
              }}
              onValueChange={(next) => {
                const rounded = clamp100(Math.round(Number(next)));
                setRating(rounded);
              }}
              trackWidthPct={0.92}
            />
          </View>

          <Pressable
            onPress={() => stepRating(1)}
            onPressIn={() => startRepeat(1)}
            onPressOut={stopRepeat}
            disabled={locked}
            style={({ pressed }) => ({
              width: 46,
              height: 46,
              borderRadius: radii.md,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: pressed ? colors.highlight : "rgba(255,255,255,0.03)",
              opacity: locked ? 0.5 : 1,
            })}
          >
            <Text style={[type.button, { fontSize: 22, color: colors.textPrimary }]}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}