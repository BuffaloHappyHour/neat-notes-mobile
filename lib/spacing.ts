// lib/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Opinionated layout rhythm (use these a lot)
  cardPadding: 18, // inside most cards
  heroPadding: 24, // inside hero cards
  sectionGap: 28, // between major blocks
} as const;