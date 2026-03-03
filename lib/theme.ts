// lib/theme.ts

export const colors = {
  // ===== Core Surfaces (no pure black/white) =====
  background: "#151515", // Deep Charcoal (app base)
  surface: "#1F1F1F", // Soft Espresso (default card)
  surfaceRaised: "#242424", // Elevated card / hero surface
  surfaceSunken: "#1A1A1A", // Inset/containers (tables, chips, list wells)

  // Borders & separators
  divider: "#2A2A2A", // Smoke divider/border
  borderSubtle: "rgba(190, 150, 99, 0.10)", // Warm amber edge (premium, subtle)
  borderStrong: "rgba(190, 150, 99, 0.16)", // For hero / focused states

  // ===== Glass surfaces (for textured background) =====
 glassSurface: "rgba(26,26,26,0.68)",
glassRaised: "rgba(36,36,36,0.66)",
  glassSunken: "rgba(18, 18, 18, 0.55)",

  glassBorder: "rgba(190, 150, 99, 0.14)",
  glassBorderStrong: "rgba(190,150,99,0.24)",
  glassDivider: "rgba(244, 241, 234, 0.10)",

  // Overlays
  overlay: "rgba(0, 0, 0, 0.55)", // Modal backdrop
  scrim: "rgba(0, 0, 0, 0.35)", // Lighter dim (menus)

  // ===== Text =====
  textPrimary: "#F4F1EA", // Warm Cream
  textSecondary: "#DDD6CA", // Muted Linen
  textTertiary: "rgba(244, 241, 234, 0.72)", // For captions / helper text
  textMuted: "rgba(244, 241, 234, 0.55)", // Very low emphasis

  // ===== Accents =====
  accent: "#BE9663", // Barrel Amber
  accentPressed: "#9E7444", // Burnt Oak
  accentSoft: "rgba(190, 150, 99, 0.18)", // Pills, subtle fills
  accentFaint: "rgba(190, 150, 99, 0.10)", // Progress track / dividers
  highlight: "#5A3E2B", // Leather Brown (subtle)

  // Optional state colors
  danger: "#D46A6A",
  success: "#79B58B",

  // ===== Shadow colors (warm, not inky) =====
  shadow: "rgba(0, 0, 0, 0.55)",
  shadowWarm: "rgba(17, 12, 7, 0.55)", // warmer than pure black
};

export const theme = { colors };