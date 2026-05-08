export function toTierLabel(score: number): string {
  if (score >= 80) return "Signature";
  if (score >= 65) return "Refining";
  if (score >= 50) return "Defining";
  if (score >= 30) return "Developing";
  return "Emerging";
}

export function statusLabel(pct: number): string {
  if (pct >= 0.7) return "Strong";
  if (pct >= 0.45) return "Medium";
  return "Building";
}
