export function fmt(value: number | null | undefined): string {
  if (value == null) return "—";
  return String(value);
}

export function fmtCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

export function fmtPct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

export function fmtNum2(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toFixed(2);
}

export function fmtDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

/**
 * STATUS SYSTEM
 */

export type MetricStatus = "good" | "warn" | "bad" | "neutral";

export function getStatusColor(status: MetricStatus) {
  switch (status) {
    case "good":
      return "#79B58B"; // colors.success
    case "warn":
      return "#BE9663"; // colors.accent
    case "bad":
      return "#D46A6A"; // colors.danger
    default:
      return "rgba(244, 241, 234, 0.35)"; // neutral
  }
}

/**
 * THRESHOLDS (centralized logic)
 */

export function statusActivation(rate?: number | null): MetricStatus {
  if (rate == null) return "neutral";
  if (rate >= 0.6) return "good";
  if (rate >= 0.4) return "warn";
  return "bad";
}

export function statusRetention(rate?: number | null): MetricStatus {
  if (rate == null) return "neutral";
  if (rate >= 0.25) return "good";
  if (rate >= 0.15) return "warn";
  return "bad";
}

export function statusCatalogCompletion(rate?: number | null): MetricStatus {
  if (rate == null) return "neutral";
  if (rate >= 0.6) return "good";
  if (rate >= 0.4) return "warn";
  return "bad";
}

export function statusCoverage(rate?: number | null): MetricStatus {
  if (rate == null) return "neutral";
  if (rate >= 0.7) return "good";
  if (rate >= 0.4) return "warn";
  return "bad";
}

export function statusLowEffort(rate?: number | null): MetricStatus {
  if (rate == null) return "neutral";
  if (rate <= 0.05) return "good";
  if (rate <= 0.15) return "warn";
  return "bad";
}

export function statusNotes(rate?: number | null): MetricStatus {
  if (rate == null) return "neutral";
  if (rate >= 0.4) return "good";
  if (rate >= 0.25) return "warn";
  return "bad";
}

export function trendArrow(value?: number | null): string {
  if (value == null) return "→";
  if (value > 0) return "↑";
  if (value < 0) return "↓";
  return "→";
}

export function trendTone(value?: number | null): "good" | "bad" | "neutral" {
  if (value == null) return "neutral";
  if (value > 0) return "good";
  if (value < 0) return "bad";
  return "neutral";
}