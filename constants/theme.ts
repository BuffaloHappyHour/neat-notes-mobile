// constants/theme.ts
/**
 * DEPRECATED
 * ----------
 * This file exists only for backward compatibility with older/template code.
 * New code should import from:
 *   - "@/lib/theme"  (colors)
 *   - "@/lib/spacing", "@/lib/radii", "@/lib/typography", "@/lib/shadows"
 *
 * We keep these exports so older components don’t break during refactors.
 */

import { colors } from "../lib/theme";

// Back-compat constant name some files expect.
export const COLORS = colors;

// Back-compat named export some files incorrectly import.
export const Colors = colors;

// Back-compat type some files expect.
export type Colors = typeof colors;