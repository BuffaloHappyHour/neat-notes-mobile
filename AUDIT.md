# WhiskeyAppBeta — Code Audit Findings

> Last audited: May 2026  
> Audited by: Claude Code (v2.1.126) + Claude (claude.ai)  
> Scope: Full codebase audit — data fetching, security, null safety, logic bugs, performance

---

## How to Use This Document

Each finding includes:
- **Status** — Open / Mitigated / Resolved
- **Residual Risk** — Actual risk after mitigating controls are considered
- **Mitigating Controls** — Existing safeguards that reduce the risk
- **Remediation** — What a full fix looks like when prioritized

---

## Mitigating Controls (Global)

These controls apply broadly and reduce the severity of multiple findings below:

| Control | Description |
|---|---|
| **RLS on `tastings`** | `tastings_select_own`, `tastings_update_own`, `tastings_delete_own`, `tastings_insert_own` policies confirmed active. Users can only read/write their own rows at the database level regardless of client-side query filters. |
| **RLS on `public_tastings`** | Write operations (insert, update, delete) are restricted to row owners. Public SELECT is intentional — this is the public mirror table by design. |
| **Rating null blocked at service layer** | `tastingSave.service.ts:120–127` throws `"Please set a rating."` if `rating == null`, preventing null ratings from reaching the database. However, rating `0` is a valid value that passes this check and can be saved. The slider initializes to `null` (displayed as "—") and the Save button is not disabled until the service-layer guard fires. |

---

## Critical Findings

---

### C1 — Profile queries missing `user_id` filter
**File:** `src/events/hooks/useProfileData.ts` lines 127–142  
**Status:** 🟡 Mitigated — not yet remediated  
**Residual Risk:** Low  

**Finding:** Five profile queries omit `.eq("user_id", session.user.id)`:
- Tasting count
- Average rating
- Top 5 whiskies
- Recent tastings
- Category breakdown (3000-row fetch)

Without filters, client intent is to read all rows across all users.

**Mitigating Controls:**  
`tastings_select_own` RLS policy enforces user-scoped reads at the database level. Supabase will only return the authenticated user's rows regardless of the missing client-side filter.

**Residual Risk Detail:**  
Bug is cosmetic under current RLS. Numbers shown are correct because RLS enforces the filter server-side. Risk would re-emerge only if RLS is ever disabled or misconfigured.

**Remediation:**  
Add `.eq("user_id", session.user.id)` to all 5 queries. Low urgency — schedule for next development cycle.

---

### C2 — Host Analytics Event Snapshot metrics computed from 12-row slice
**File:** `src/events/hooks/useEventPageData.ts` lines 207–229  
**Status:** ✅ Resolved  
**Residual Risk:** None  

**Finding:** `summary` (tastingCount, uniqueUsers, uniqueNames, averageRating) is derived from `recent`, which is fetched with `.limit(12)`. For any event with more than 12 tastings, all 4 Event Snapshot metrics are wrong. The `mostRatedData` query already fetches the full dataset with no limit but is not used for the summary.

**Mitigating Controls:** None — this is a logic bug with no database-level safeguard.

**Residual Risk Detail:**  
Hosts are actively seeing incorrect event statistics. This is the highest priority fix.

**Remediation:**  
1. Add `user_id` to the `mostRatedData` select query  
2. Derive `summary` from `mostRatedData` (full dataset) instead of `recent` (12-row slice)  
3. Fix `TopWhiskeyRow.avg_rating` type from `number` to `number | null` (see L5)

---

### C3 — Tasting update path has no ownership check
**File:** `src/services/tastingSave.service.ts` lines 357–363  
**Status:** 🟡 Mitigated — not yet remediated  
**Residual Risk:** Low  

**Finding:** The update path calls `.update(payload).eq("id", tastingId)` without verifying the tasting belongs to the current user. The `if (!user) throw` guard only protects the insert branch.

**Mitigating Controls:**  
`tastings_update_own` RLS policy blocks updates to rows not owned by the authenticated user at the database level.

**Remediation:**  
Add `.eq("user_id", session.user.id)` to the update query as a defense-in-depth measure. Low urgency.

---

### C4 — `.toFixed(1)` on potentially null `avg_rating` in event Top Rated list
**File:** `app/event/[id]/index.tsx` line 279  
**Status:** 🟡 Mitigated — not yet remediated  
**Residual Risk:** Low  

**Finding:** `row.avg_rating.toFixed(1)` will throw `TypeError` if `avg_rating` is null. The RPC can return null for whiskies with no numeric ratings. Lines 401 and 468 in the same file correctly guard this — line 279 was missed.

**Mitigating Controls:**  
Confirmed: `tastingSave.service.ts` blocks `null` ratings at the service layer before they reach the database. A rating of `0` is technically valid and submittable (user can drag slider to zero), but `null` cannot be persisted through the normal save flow. The crash path is therefore not reachable under normal usage.

**Residual Risk Detail:**  
Low — null avg_rating cannot enter via the standard UI flow. Risk remains if data is inserted via other means (e.g., direct DB access, migration, or a future save path that bypasses the service layer). The type lie in L5 means TypeScript won't catch any future regressions.

**Remediation:**  
Change line 279 to: `row.avg_rating != null ? row.avg_rating.toFixed(1) : "—"`  
Also fix `TopWhiskeyRow.avg_rating` type to `number | null` (see L5) to make TypeScript enforce the guard going forward.

---

## Medium Findings

---

### M1 — Profile delete has no user ownership check
**File:** `src/events/hooks/useProfileData.ts` line 381  
**Status:** 🟡 Mitigated — not yet remediated  
**Residual Risk:** Low  

**Finding:** Delete calls `.delete().eq("id", actionsRow.id)` without `.eq("user_id", session.user.id)`.

**Mitigating Controls:** `tastings_delete_own` RLS policy blocks deletion of rows not owned by the current user.

**Remediation:** Add `.eq("user_id", session.user.id)` as defense-in-depth.

---

### M2 — `.single()` fires spurious errors for new users
**Files:** `useInsightsData.ts` line 86, `useClarityInsightsData.ts` line 164  
**Status:** 🔴 Open  
**Residual Risk:** Low — functional issue only, no data risk  

**Finding:** Both hooks use `.single()` on `user_metrics_90d_v4`. For new users with no metrics row, `.single()` returns a Supabase error, triggering `console.error("Failed to load...")` on every load — a false alarm that pollutes error monitoring.

**Remediation:** Replace `.single()` with `.maybeSingle()` and handle the no-data state explicitly.

---

### M3 — Event page query errors silently discarded
**File:** `src/events/hooks/useEventPageData.ts` lines 129–154  
**Status:** ✅ Resolved  
**Residual Risk:** None  

**Finding:** `Promise.all([...])` destructures only `data`, discarding `error`. Network failures or RLS rejections produce silent empty states with no error indication.

**Remediation:** Destructure and check `error` from each query. Surface a user-facing error state when queries fail.

---

### M4 — `personal_notes` written to `public_tastings` mirror table
**File:** `src/services/publicMirror.service.ts` lines 127–132  
**Status:** ✅ Resolved  
**Residual Risk:** None  

**Finding:** `personal_notes` field is included in the `public_tastings` upsert. Current event page queries don't select this column, so it isn't surfaced in UI — but the data exists in the table.

**Resolution:** personal_notes removed from public mirror upsert in publicMirror.service.ts and tastingSave.service.ts. 264 existing rows wiped from public_tastings via SQL. Column remains on table but no longer populated.

---

### M5 — 3000-row client-side fetch for category bar chart
**File:** `src/events/hooks/useProfileData.ts` line 142  
**Status:** 🔴 Open  
**Residual Risk:** Low now, medium at scale  

**Finding:** Up to 3000 `whiskey_id` rows are fetched client-side to compute a category distribution, followed by a second sequential query for category lookup. Calculation runs in JavaScript.

**Remediation:** Replace with a server-side aggregation RPC. Schedule for performance optimization cycle.

---

### M6 — Hardcoded fallbacks fabricate venue data
**File:** `src/services/tastingSave.service.ts` lines 229, 278  
**Status:** 🔴 Open  
**Residual Risk:** Medium — pollutes venue database with invented values  

**Finding:** Empty pour size defaults to `1oz`, empty bottle size defaults to `750ml` in `upsert_venue_whiskey_offering`. These invented values are written to the venue pricing database.

**Remediation:** Pass `null` instead of hardcoded fallbacks when fields are empty. Update RPC to accept nullable values if needed.

---

## Low Findings

---

### L1 — `as any` casts suppress route type checking
**Files:** `app/event/[id]/index.tsx` line 510, `app/event/[id]/host.tsx` line 260  
**Status:** 🔴 Open  
**Residual Risk:** Low — broken routes fail silently at runtime  

**Remediation:** Define proper typed routes in Expo Router config and remove `as any` casts.

---

### L2 — RPC fetches 10 Top Rated whiskies, UI shows 5
**File:** `src/events/hooks/useEventPageData.ts` line 146  
**Status:** 🔴 Open  
**Residual Risk:** Low — minor inefficiency  

**Finding:** `event_top_whiskies` called with `p_limit: 10`, but `host.tsx` slices to 5.

**Remediation:** Change RPC call to `p_limit: 5`, or remove `.slice(0, 5)` if showing 10 is intended.

---

### L3 — `console.log` left in production code
**File:** `src/hooks/useClarityInsightsData.ts` line 173  
**Status:** 🔴 Open  

**Remediation:** Remove `console.log("90d metrics:", metrics)`.

---

### L4 — Insights hooks don't re-fetch when user changes
**Files:** `useInsightsData.ts`, `useClarityInsightsData.ts`  
**Status:** 🔴 Open  
**Residual Risk:** Low — logout typically unmounts component tree  

**Finding:** Both hooks use `useEffect(() => { load(); }, [])`. If session changes without full unmount, stale data remains.

**Remediation:** Add session/user ID to the dependency array.

---

### L5 — `avg_rating` typed as non-nullable, masking C4 crash risk
**File:** `src/events/hooks/useEventPageData.ts` line 22  
**Status:** 🔴 Open  

**Finding:** `TopWhiskeyRow.avg_rating: number` should be `number | null`. The incorrect type prevented TypeScript from flagging the missing null guard in C4.

**Remediation:** Update type to `number | null`. This will surface any other unguarded usages at compile time.

---

### L6 — "Save failed" alert title shown for validation errors
**File:** `app/cloud-tasting.tsx` lines 783–797  
**Status:** 🔴 Open  
**Residual Risk:** Low — UX issue only  

**Finding:** When a user taps Save without setting a rating (or without entering a whiskey name), the Alert title is `"Save failed"` — implying a network or server error. The actual cause is a validation failure. Same issue applies to the name validation path.

**Remediation:** Catch validation errors separately and show a title like `"Rating required"` or `"Missing information"` instead of `"Save failed"`.

---

### L7 — Rating `0` is submittable with no floor enforcement
**File:** `src/services/tastingSave.service.ts` lines 120–127  
**Status:** 🔴 Open  
**Residual Risk:** Low — product/data quality question  

**Finding:** The service only blocks `null`. A rating of `0` passes the `== null` check and can be saved. The slider initializes at null (shown as "—") and tapping `−` from that state clamps to 0, which is then a valid submittable value. Whether 0 is a meaningful rating on your scale is a product decision, but no floor is enforced anywhere in the save chain.

**Remediation:** Decide on minimum valid rating (e.g., 1) and enforce at service layer: `if (rating == null || rating < 1) throw new Error("Please set a rating.")`

---

## Summary Table

| ID | File | Severity | Status | Residual Risk | Issue |
|---|---|---|---|---|---|
| C1 | useProfileData.ts:127–142 | Critical | 🟡 Mitigated | Low | 5 queries missing user_id filter |
| C2 | useEventPageData.ts:207–229 | Critical | ✅ Resolved | None | Event Snapshot metrics from 12-row slice |
| C3 | tastingSave.service.ts:357–363 | Critical | 🟡 Mitigated | Low | Update has no ownership check |
| C4 | event/[id]/index.tsx:279 | Critical | 🟡 Mitigated | Low | .toFixed(1) on nullable avg_rating |
| M1 | useProfileData.ts:381 | Medium | 🟡 Mitigated | Low | Delete has no ownership check |
| M2 | useInsightsData.ts:86, useClarityInsightsData.ts:164 | Medium | 🔴 Open | Low | .single() fires false errors for new users |
| M3 | useEventPageData.ts:129–154 | Medium | ✅ Resolved | None | Query errors silently discarded |
| M4 | publicMirror.service.ts:127–132 | Medium | ✅ Resolved | None | personal_notes in public mirror — intent unclear |
| M5 | useProfileData.ts:142 | Medium | 🔴 Open | Low now | 3000-row client fetch for bar chart |
| M6 | tastingSave.service.ts:229,278 | Medium | 🔴 Open | Medium | Hardcoded fallbacks fabricate venue data |
| L1 | index.tsx:510, host.tsx:260 | Low | 🔴 Open | Low | as any suppresses route type checking |
| L2 | useEventPageData.ts:146 | Low | 🔴 Open | Low | RPC fetches 10, UI shows 5 |
| L3 | useClarityInsightsData.ts:173 | Low | 🔴 Open | Low | console.log in production |
| L4 | useInsightsData.ts, useClarityInsightsData.ts | Low | 🔴 Open | Low | No re-fetch on user change |
| L5 | useEventPageData.ts:22 | Low | 🔴 Open | Low | avg_rating typed non-nullable |
| L6 | cloud-tasting.tsx:783–797 | Low | 🔴 Open | Low | "Save failed" shown for validation errors |
| L7 | tastingSave.service.ts:120–127 | Low | 🔴 Open | Low | Rating 0 is submittable — no floor enforced |

---

## Pending Confirmations

- [ ] **M4 intent** — Confirm whether `personal_notes` in `public_tastings` is intentional. Check RLS on `public_tastings` SELECT to determine if other authenticated users can read this column.

---

## Audit Log

| Date | Type | Scope | Notes |
|---|---|---|---|
| May 2026 | Full codebase | All hooks, services, screens | Initial audit. 4 Critical, 6 Medium, 5 Low findings. RLS confirmed on tastings and public_tastings tables. |
