import { UserMetrics90dRow } from "../hooks/useClarityInsightsData";

function prettyTrait(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateHeroBullets(metrics: UserMetrics90dRow): string[] {
  const bullets: string[] = [];

  // Bullet A — trending trait (biggest riser)
  if (metrics.biggest_riser_l1) {
    bullets.push(
      `${prettyTrait(metrics.biggest_riser_l1)} notes are rising fastest in your recent pours`
    );
  }

  // Bullet B — proof intensity preference
  const proof = Number(metrics.proof_pref ?? 3.0);
  if (proof <= 2.8) {
    bullets.push(`You rate lower proof intensity pours higher than bold ones`);
  } else if (proof >= 3.5) {
    bullets.push(`You rate higher proof intensity pours higher than softer ones`);
  }

  // Bullet C — avoided traits
  const avoided = metrics.avoided_traits_l1 ?? [];
  if (avoided.length >= 2) {
    const names = avoided.slice(0, 2).map(prettyTrait).join(" and ");
    bullets.push(`Your palate actively avoids ${names}`);
  } else if (avoided.length === 1) {
    bullets.push(`Your palate actively avoids ${prettyTrait(avoided[0])}`);
  }

  // Bullet D — top category fallback
  if (bullets.length < 2 && metrics.top_category) {
    bullets.push(`Your highest-rated pours are ${metrics.top_category} whiskies`);
  }

  // Bullet E — top trait fallback
  const topTrait = (metrics.top_traits_l1 ?? [])[0];
  if (bullets.length < 2 && topTrait) {
    bullets.push(`You consistently reach for ${prettyTrait(topTrait)} notes`);
  }

  return bullets.slice(0, 3);
}

export type StretchReason = {
  label: string;
  detail: string;
};

export function generateStretchReason(
  metrics: UserMetrics90dRow,
  stretchWhiskeyTypeId: string | null
): StretchReason {
  const affinity = metrics.whiskey_type_affinity;

  // If we have the specific whiskey type for the stretch pick, use it
  if (stretchWhiskeyTypeId && affinity) {
    const typeData = affinity[stretchWhiskeyTypeId];
    if (typeData) {
      if (typeData.count === 0) {
        return {
          label: `You've never logged a ${typeData.name}`,
          detail: "A gap worth exploring — your palate hasn't formed an opinion yet.",
        };
      }
      if (typeData.count <= 2) {
        return {
          label: `You've only tried ${typeData.name} ${typeData.count === 1 ? "once" : "twice"}`,
          detail: typeData.avg_rating && typeData.avg_rating >= 78
            ? `You rated it ${typeData.avg_rating} — your palate may be more aligned than you think.`
            : "Not enough pours to know if it fits your palate yet.",
        };
      }
      if (typeData.count >= 3 && typeData.avg_rating && typeData.avg_rating < 75) {
        return {
          label: `${typeData.name} hasn't clicked yet`,
          detail: "This pick takes a different angle — it may change your mind.",
        };
      }
      return {
        label: `Push past your usual ${typeData.name} pours`,
        detail: "Your profile suggests you're ready for something that challenges your palate.",
      };
    }
  }

  // Fallback — find the best untried or least-tried eligible type
  if (affinity) {
    const entries = Object.values(affinity);
    const untried = entries.filter((e) => e.count === 0);
    if (untried.length > 0) {
      const pick = untried[0];
      return {
        label: `You've never logged a ${pick.name}`,
        detail: "A gap worth exploring — your palate hasn't formed an opinion yet.",
      };
    }
  }

  // Generic fallback
  return {
    label: "Push your palate in a new direction",
    detail: "Your profile suggests you're ready to explore beyond your usual pours.",
  };
}
