import type { PalateClarityTierLabel } from "../palateClarity.service";

export const PALATE_TIER_LABELS: PalateClarityTierLabel[] = [
  "Emerging",
  "Developing",
  "Defining",
  "Refining",
  "Signature Palate",
];

export const PALATE_TIER_COPY: Record<
  PalateClarityTierLabel,
  { headline: string; subline: string }
> = {
  Emerging: {
    headline: "Your palate journey begins.",
    subline: "Log your first pour — flavor notes sharpen everything.",
  },
  Developing: {
    headline: "Patterns are forming.",
    subline: "Add flavor notes when you log to accelerate your clarity.",
  },
  Defining: {
    headline: "Your palate is taking shape.",
    subline: "You have a point of view.",
  },
  Refining: {
    headline: "A refined palate.",
    subline: "The details are where your taste lives now.",
  },
  "Signature Palate": {
    headline: "A signature palate.",
    subline: "Few reach this point. Your taste is distinctly yours.",
  },
};

export function getTierCopy(
  label: PalateClarityTierLabel | null
): { headline: string; subline: string } {
  return PALATE_TIER_COPY[label ?? "Emerging"];
}
