// lib/typography.ts
import { Platform, TextStyle } from "react-native";
import { colors } from "./theme";

/**
 * IMPORTANT:
 * With @expo-google-fonts/*, the registered font family names are the variant keys
 * (e.g., "CormorantGaramond_600SemiBold").
 *
 * On Android, fontWeight is unreliable with custom fonts,
 * so we use explicit font families per weight.
 */
export const fontFamilies = {
  headingRegular: Platform.select({
    ios: "CormorantGaramond_400Regular",
    android: "CormorantGaramond_400Regular",
    default: "CormorantGaramond_400Regular",
  }),
  headingItalic: Platform.select({
    ios: "CormorantGaramond_400Regular_Italic",
    android: "CormorantGaramond_400Regular_Italic",
    default: "CormorantGaramond_400Regular_Italic",
  }),
  headingSemiBold: Platform.select({
    ios: "CormorantGaramond_600SemiBold",
    android: "CormorantGaramond_600SemiBold",
    default: "CormorantGaramond_600SemiBold",
  }),

  bodyRegular: Platform.select({
    ios: "Montserrat_400Regular",
    android: "Montserrat_400Regular",
    default: "Montserrat_400Regular",
  }),
  bodyMedium: Platform.select({
    ios: "Montserrat_500Medium",
    android: "Montserrat_500Medium",
    default: "Montserrat_500Medium",
  }),
};

type TypeScale = {
  screenTitle: TextStyle;
  sectionHeader: TextStyle;
  body: TextStyle;
  microcopyItalic: TextStyle;
  button: TextStyle;
  ratingNumber: TextStyle;
};

export const type: TypeScale = {
  // Cormorant — emotional anchor
  screenTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0.2,
    color: colors.textPrimary,
  },

  // Cormorant — stable section headers
  sectionHeader: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.2,
    color: colors.textPrimary,
  },

  // Montserrat — readable notes + form content
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: colors.textPrimary,
  },

  /**
   * Cormorant italic — refined “whisper” layer (but still readable).
   * The key change: default to textPrimary so it never looks washed out on iOS.
   * If a screen wants it lighter, it can apply opacity at the callsite.
   */
  microcopyItalic: {
    fontFamily: fontFamilies.headingItalic,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.35,
    color: colors.textPrimary,
    opacity: 0.84,
  },

  // Montserrat — UI actions (never italic, never all caps)
  button: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },

  // Montserrat medium — rating number display
  ratingNumber: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: 1,
    color: colors.textPrimary,
  },
};