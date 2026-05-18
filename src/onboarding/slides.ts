export type OnboardingSlide = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  visual: "glass" | "clarity" | "radar" | "icons";
  cta?: string;
  ctaSecondary?: string;
};

export const SLIDES: OnboardingSlide[] = [
  {
    id: "pour",
    eyebrow: "EVERY POUR COUNTS",
    headline: "As simple or as detailed as you want.",
    body: "Log a quick rating, or go deep with 225+ flavor descriptors across 11 categories. Your choice, every time.",
    visual: "glass",
  },
  {
    id: "clarity",
    eyebrow: "YOUR PALATE IDENTITY",
    headline: "Your palate has a fingerprint.",
    body: "Palate Clarity measures how consistently you reach for the same flavors. The more you log, the clearer your picture becomes.",
    visual: "clarity",
  },
  {
    id: "intelligence",
    eyebrow: "THE INTELLIGENCE",
    headline: "Neat Notes reads between the pours.",
    body: "Your Flavor Radar, Pour Profile, and Insights reveal patterns you wouldn't spot on your own.",
    visual: "radar",
  },
  {
    id: "discover",
    eyebrow: "YOUR PALATE, PUT TO WORK",
    headline: "We help you find what's next.",
    body: "Personalized recommendations, whiskey events, and venue discovery — all shaped by your taste.",
    visual: "icons",
    cta: "Log your first pour",
    ctaSecondary: "Take me home",
  },
];
