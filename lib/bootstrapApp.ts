import { syncPremiumStatusFromRevenueCat } from "./premiumSync";

/**
 * Coordinates the cold-open bootstrap sequence.
 * Runs premium sync on cold open so is_premium is always fresh before the app renders.
 * Never throws — errors caught internally so the splash always dismisses.
 *
 * Session check is handled by the existing Supabase call in _layout.tsx.
 * Host/operator status is event-scoped and handled by useEventPageData — not needed here.
 */
export async function bootstrapApp(): Promise<void> {
  await Promise.all([
    syncPremiumStatusFromRevenueCat().catch((e) =>
      console.warn("[bootstrap] premium sync failed:", e)
    ),
  ]);
}
