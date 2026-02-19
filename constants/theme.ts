export const COLORS = {
  ink: "#222940",       // primary text & anchors
  tan: "#BE9663",       // main CTA + dividers + active states
  lightBlue: "#6CA6D8", // secondary highlight
  bg: "#F7F2EA",        // app background
  card: "#FFFFFF",      // content surfaces
  border: "#E7DFD4",    // outlines & separators
} as const;

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
} as const;

export const TEXT = {
  title: 28,
  h1: 22,
  h2: 18,
  body: 15,
  small: 13,
} as const;

export const SHADOW = {
  // Light “card lift” like your Figma (subtle)
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
} as const;

