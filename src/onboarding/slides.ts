export type OnboardingSlide = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  introText: string;
  visual: "glass" | "clarity" | "radar" | "picks";
  cta?: string;
  ctaSecondary?: string;
};

export const SLIDES: OnboardingSlide[] = [
  {
    id: "log",
    eyebrow: "EVERY POUR COUNTS",
    headline: "Log each tasting as simply or as deeply as you want.",
    body: "A quick rating or 225+ flavor descriptors across 11 categories — your choice, every time.",
    introText: "Neat Notes is your intelligent whiskey journal. Every pour you log, your palate gets more defined.",
    visual: "glass",
  },
  {
    id: "clarity",
    eyebrow: "YOUR PALATE IDENTITY",
    headline: "Your palate has a fingerprint.",
    body: "Palate Clarity measures how consistently you reach for the same flavors. The more you log, the clearer your picture becomes.",
    introText: "Neat Notes analyzes your logs and helps you understand your palate better with every pour.",
    visual: "clarity",
  },
  {
    id: "radar",
    eyebrow: "THE INTELLIGENCE",
    headline: "Neat Notes reads between the pours.",
    body: "Your Flavor Radar, Pour Profile, and Insights reveal patterns you wouldn't spot on your own.",
    introText: "Each flavor note you track is a signal. Insights helps you understand what you like, what you don't, and why.",
    visual: "radar",
  },
  {
    id: "next",
    eyebrow: "YOUR NEXT POUR",
    headline: "Safe picks and stretch picks, tailored to you.",
    body: "Every recommendation is shaped by your actual taste — not popularity.",
    introText: "Your next pour, already waiting. Neat Notes recommends whiskies based on what you love and what you haven't explored yet.",
    visual: "picks",
    cta: "Log your first pour",
    ctaSecondary: "Take me home",
  },
];
