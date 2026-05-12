WhiskeyAppBeta — Feature Ideas & Roadmap

> Last updated: May 10, 2026  
> Maintained by: Derek  

---

## How to Use This Document

Each feature includes:
- **ID** — Sequential identifier (F001, F002, etc.)
- **Area** — App section (Events, Profile, Analytics, Tasting, Venue, UX, Infrastructure)
- **Priority** ⚠️ MANDATORY — High / Medium / Low
- **Release Target** ⚠️ MANDATORY — Milestone (v1.0.8, v1.1.0, Backlog, etc.)
- **Complexity** ⚠️ MANDATORY — Low / Medium / High
- **Risk** ⚠️ MANDATORY — Low / Medium / High
- **Status** — Idea → Scoped → In Progress → Testing → Done
- **Description** — What the feature is and why it matters
- **Notes** — Any context, open questions, or dependencies

---

## Status Definitions

| Status | Meaning |
|---|---|
| 💡 Idea | Captured, not yet evaluated or sized |
| 🔍 Scoped | Requirements defined, effort estimated, ready to build |
| 🔨 In Progress | Actively being developed |
| 🧪 Testing | Built, being tested before release |
| ✅ Done | Shipped |

---

## Feature Table

| ID | Feature | Area | Priority | Release Target | Complexity | Risk | Status | Description |
|---|---|---|---|---|---|---|---|---|
| F001 | All Tastings Page Revamp | Tasting | Low | v1.0.8 | Low | Low | ✅ Done | Scroll layering bug fixed, full visual redesign — glass cards, whiskey type metadata, amber rating badges, sticky header |
| F002 | Fix Host Analytics Event Snapshot metrics (C2) | Analytics | High | v1.0.8 | Low | Low | ✅ Done | Summary metrics computed from 12-row slice — wrong for events with >12 tastings |
| F003 | Surface query errors on Event page (M3) | Events | Medium | v1.0.8 | Low | Low | ✅ Done | Silent failures show empty UI with no user feedback when queries fail |
| F004 | Verify personal_notes in public mirror (M4) | Infrastructure | Medium | v1.0.8 | Low | Medium | ✅ Done | personal_notes written to public_tastings — confirm intent and restrict if unintentional |
| F005 | Fix hardcoded venue data fallbacks (M6) | Venue | Medium | v1.0.9 | Low | Low | ✅ Done | Empty pour/bottle size fields write fabricated 1oz/750ml values to venue DB |
| F006 | Investigate Exposed Auth Users views (DB1/DB2) | Infrastructure | High | v1.0.9 | Low | Medium | ✅ Done | tastings_with_email and analytics_activation views may expose user emails |
| F007 | Add user_id filters to profile queries (C1) | Profile | Low | v1.1.0 | Low | Low | 💡 Idea | 5 profile queries missing user_id filter — mitigated by RLS but should be fixed |
| F008 | Add ownership checks to update/delete (C3/M1) | Infrastructure | Low | v1.1.0 | Low | Low | 💡 Idea | Update and delete paths missing user_id check — mitigated by RLS |
| F009 | Fix null guard on avg_rating (C4/L5) | Tasting | Low | — | Low | Low | ✅ Done | .toFixed(1) on nullable avg_rating + fix type definition |
| F010 | Replace .single() with .maybeSingle() (M2) | Infrastructure | Low | v1.1.0 | Low | Low | 💡 Idea | Spurious errors logged for new users with no metrics data |
| F011 | Move category breakdown to server-side RPC (M5) | Infrastructure | Low | v1.1.0 | Medium | Low | 💡 Idea | 3000-row client-side fetch for a simple bar chart — needs server aggregation |
| F012 | Fix route type casting (L1) | Infrastructure | Low | Backlog | Low | Low | 💡 Idea | as any casts suppress Expo Router compile-time route checking |
| F013 | Align RPC limit with UI display (L2) | Analytics | Low | Backlog | Low | Low | 💡 Idea | RPC fetches 10 top whiskies, UI shows 5 — align to avoid wasted network call |
| F014 | Remove console.log from production (L3) | Infrastructure | Low | — | Low | Low | ✅ Done | console.log("90d metrics") left in useClarityInsightsData.ts |
| F015 | Fix insights hooks re-fetch on user change (L4) | Infrastructure | Low | Backlog | Low | Low | 💡 Idea | Hooks don't re-fetch when session changes — stale data can persist |
| F016 | Fix "Save failed" title for validation errors (L6) | UX | Low | Backlog | Low | Low | 💡 Idea | Validation errors show "Save failed" implying network issue |
| F017 | Enforce minimum rating floor (L7) | Tasting | Low | Backlog | Low | Low | 💡 Idea | Rating 0 is submittable — decide on minimum valid rating and enforce it |
| F018 | Shareable Flavor Profile Card | UX | High | v1.1.0 | Medium | Low | 💡 Idea | Branded shareable image card (Stories + Square) with radar chart, Palate Clarity score, top traits, and personalized tagline |
| F019 | Insights Revamp | Insights | High | v1.0.8 | High | Medium | ✅ Done | Summary tab restructured, Pour Profile tab added, Flavor Map renamed, Hero Card shipped. |
| F020 | Push Notification System | Infrastructure | High | v1.1.0 | Medium | Low | 💡 Idea | Weekly palate check-ins, palate score updates, milestone alerts (50 tastings, Refining tier, etc.) with Whoop-style retention model |
| F021 | Location Platform Foundation | Infrastructure | High | v1.2.0 | High | Medium | 💡 Idea | Enable location permissions, core location infrastructure, privacy controls — foundation for all location-based features |
| F022 | Nearby Whiskey Alerts | UX | Medium | v1.2.0 | Medium | Low | 💡 Idea | Push notification when a favorited whiskey is logged nearby by another user |
| F023 | Bars Nearby with Your Whiskey | Discover | Medium | v1.2.0 | Medium | Low | 💡 Idea | Find bars serving whiskies that match your flavor profile and favorites |
| F024 | Top Whiskey Bars in Your Area | Discover | Medium | v1.2.0 | Medium | Low | 💡 Idea | Curated bar discovery ranked by community ratings and whiskey selection |
| F025 | Upcoming Public Events Near You | Events | Medium | v1.2.0 | Low | Low | 💡 Idea | Event discovery surface driven by user location — find tastings, pours, and whiskey events nearby |
| F026 | Phone Number Sign-In | Profile | High | v1.0.8 | Medium | Low | ✅ Done | Phone as secondary auth layer. Sign-up: email required, then choose email or SMS verification — phone linked to profile in same step. Sign-in: phone + OTP for users with linked number. Cannot create account with phone only. |
| F027 | Venue Check-In Foundation | Venue | High | v1.1.1 | High | Medium | 💡 Idea | Core venue check-in infrastructure — tastings mapped to venues, venue profiles, check-in flow |
| F028 | Venue Host Analytics Dashboard | Venue | High | v1.1.2 | Medium | Low | 💡 Idea | Real-time analytics for venue owners — popular pours, visitor counts, tasting trends. B2B revenue feature |
| F029 | B2B Venue Owner Access & Monetization | Infrastructure | High | v1.1.2 | Medium | Medium | 💡 Idea | Gated analytics access sold to venue/bar/restaurant owners — subscription or one-time access model |
| F030 | Event Host Analytics Revamp | Analytics | High | v1.1.1 | Medium | Low | 💡 Idea | Revamp existing event host analytics to be richer and more actionable — foundation shared with venue analytics |
| F031 | Delete Tasting from Edit Flow | Tasting | Low | v1.0.8 | Low | Low | ✅ Done | Add Delete option when tapping Edit on a tasting — action sheet with Edit, Delete, Cancel instead of going straight to edit form |
| F032 | Log Again from Previous Tasting | Tasting | Medium | v1.0.8 | Low | Low | ✅ Done | "Log again" shortcut on tastings with 2+ records — available in All Tastings actions sheet, expands inline |
| F033 | Palate Clarity Unique Whiskey Calculation | Insights | High | v1.1.0 | Medium | Medium | 💡 Idea | Recalculate Palate Clarity and core insights using unique whiskey records only — prevents inflation from logging the same bottle repeatedly |
| F034 | Whiskey Evolution Insights | Insights | Medium | v1.1.0 | Medium | Low | 💡 Idea | Track how perception of the same whiskey changes over time across multiple logs — first pour vs. mid-bottle vs. last dram. Unique differentiator vs. other apps |
| F035 | Website — Core Marketing Site | Website | High | Website | Medium | Low | 💡 Idea | Unified web platform — official marketing site, auth/callback/reset handler, future admin portal and partner dashboard. One repo, one domain, one source of truth under neatnotesapp.com. |
| F036 | Website — Public Events Finder | Website | High | Website | Medium | Low | 💡 Idea | Public-facing table/map of upcoming whiskey events near the visitor — drives app downloads, great SEO. Requires F021 Location Platform |
| F037 | Bottle Collection Tracker | Tasting | High | v1.1.0 | Medium | Low | 💡 Idea | Track personal whiskey collection — add via manual entry or barcode scan, bottle status (sealed/open/half/nearly gone/finished), ties to existing tasting records |
| F038 | Claude "What Should I Drink?" Recommendation | Insights | High | v1.1.0 | Medium | Low | 💡 Idea | Natural language prompt against your collection — type the notes you want to taste, Claude cross-references your collection and tasting history to recommend what to pour tonight. |
| F039 | App Store / Play Store Review Prompt | UX | High | v1.0.8 | Low | Low | ✅ Done | Prompt users to rate the app after reaching 5 tastings. Fires on next cold open. One-time only via review_prompted_at. useRef guard prevents double-fire. |
| F040 | Pour Profile Tab | Insights | High | v1.0.8 | Medium | Low | ✅ Done | New Insights tab showing Proof Point classification, perception bar charts for Texture/Proof/Flavor with sweet spot and gap insights. |
| F041 | Insights Summary Tab Restructure | Insights | High | v1.0.8 | Medium | Low | ✅ Done | Summary rebuilt into 6 sections: Identity Header, What to Try Next, Here's Why chips, Palate Snapshot 2x2 grid, Flavor Fingerprint, Coach's Note. |
| F042 | Hero Card with Here's Why Bullets | Insights | High | v1.0.8 | High | Low | ✅ Done | Hero Card built and shipped in v1.0.8. Single amber-bordered card with horizontal scrollable Safe Pick + Stretch Pick cards, Here's Why data-backed bullets, and tab navigation chips. Stretch Pick driven by whiskey_type_affinity gap logic — targets types user has never or rarely tried. Safe Pick driven by recommendation_rules. Both cards use accent/accentPressed color hierarchy. |
| F043 | Fix L1 Flavor Sentiment Inference | Infrastructure | High | v1.0.8 | Low | Low | ✅ Done | When user selects L2/L3 LIKE nodes, parent L1 now correctly infers LIKE via hasLikedDescendant() walk. |
| F044 | Bar / Venue Menu Feature | Venue | High | v1.1.1 | High | Medium | 🔍 Scoped | Venue page with filterable whiskey menu, community ratings, out-of-stock flagging. Premium: Palate Match score. First use case: Hartman's Speakeasy. |
| F045 | Whiskey Type Correlation Insights | Insights | High | v1.1.0 | Medium | Low | 💡 Idea | Surface insights like "you prefer high proof Single Malts over Bourbon" using whiskey_type_id joined with tastings and ratings. |
| F046 | Palate Match for Venue Menus | Venue | High | v1.1.2 | High | Medium | 💡 Idea | Premium feature on venue menu pages. Match user flavor profile + pour preferences against whiskey community flavor data. |
| F047 | SMS Consent Text + Twilio Resubmission | Infrastructure | High | v1.0.8 | Low | Low | ✅ Done | TCPA-compliant consent disclosure added. Twilio toll-free verified ✅ May 6, 2026. |
| F048 | Custom Whiskey Submission Flow Redesign | Tasting | High | v1.1.0 | Medium | Low | 💡 Idea | Remove canonical slug, replace classification fields with taxonomy dropdowns, MVP required fields: Name, Proof, Whiskey Type only. |
| F049 | Account Settings — Add / Change Phone Number | Profile | High | v1.0.8 | Low | Low | ✅ Done | Phone management card: add, change, remove linked phone. OTP verification required. profiles.phone write bug fixed. |
| F050 | Whiskey Card Revamp | Tasting | High | v1.1.0 | Medium | Low | 💡 Idea | Full redesign of whiskey profile card — tasting history, Log Again shortcut (2+ tastings), richer bottle metadata, BHH review integration, premium community flavor data. |
| F051 | Paywall Analytics Instrumentation | Analytics | High | v1.0.8 | Low | Low | ✅ Done | insights_screen_viewed, purchase_tapped, purchase_completed, restore_completed tracked in analytics_events. Non-premium only. Double-fire fixed via useRef guard. |
| F052 | Bulletproof Barcode Flow | Infrastructure | High | v1.0.8 | Medium | Low | ✅ Done | UPC pre-population from lookup-upc title, barcode threaded through custom tasting flow, pending_candidate mapping fires after maybeCreateWhiskeyCandidate returns, RPC resolves on promote/merge. Schema: candidate_id added to whiskey_barcodes. |
| F053 | Go-UPC Fallback + Bottle Images | Infrastructure | High | v1.1.0 | Medium | Low | 💡 Idea | Add Go-UPC as fallback lookup when UPCitemdb returns nothing. Pull bottle images from both services. Add image_url to whiskeys + whiskey_candidates tables. Show bottle image on scan confirmation and whiskey card. UPC Data 4 Spirits: 16,500 whiskey records, $1,750 (Gregg London, gregg@glondon.com). |
| F054 | User Submit Edits for Whiskey Records | Tasting | High | v1.0.9 | Medium | Low | 💡 Idea | Allow users to suggest corrections to proof, age, distillery, region, whiskey type on canonical whiskey records. Goes through admin review before applying. Crowdsources missing data at scale. |
| F055 | Fuzzy/Trigram Search for Whiskey Lookup | Infrastructure | High | v1.0.9 | Low | Low | 💡 Idea | Current search uses ILIKE %substring% — no typo tolerance. A user typing "lagovolin" gets no results and creates a duplicate custom record. Fix: enable pg_trgm extension, add GIN index on whiskeys.display_name, update search query in log.tsx to use similarity() or word_similarity() instead of ILIKE. Directly protects catalog data quality now that we have 12,701 whiskeys. |
| F056 | Whiskey Catalog Import (UPC Data 4 Spirits) | Infrastructure | High | v1.1.0 | High | Medium | ✅ Done (May 10, 2026) | Bulk import of 11,596 whiskeys and 13,080 UPC barcodes from working-whiskey.xlsx (UPC Data 4 Spirits dataset). Catalog grew from 1,161 to 12,701 active whiskeys. All records classified by whiskey_type, category, region. 95.6% proof coverage. Import pipeline: classification script → staging table → fuzzy dedup against existing catalog → enrich matched records → promote new records → load barcodes. Scripts: whiskey_import_classifier.py, fuzzy_match.py, enrich_matched.py, promote_new.py. |
| F057 | Search Relevance Ranking | UX | High | v1.0.9 | Low | Low | 💡 Idea | With 12,701 whiskeys in the catalog, alphabetical search ranking is broken — "Sazerac" surfaces obscure barrel selects before standard Sazerac Rye. Fix: replace .order("display_name") with an RPC scoring starts-with +10pts, shorter name ranked higher, has community tastings +5pts, alphabetical as tiebreaker. Also reduce result limit from 10 to 7. |
| F058 | Web Platform Consolidation & Migration | Website | High | v1.0.9 | Medium | Low | 💡 Idea | Migrate auth/callback + password reset from neatnotes-web (buried in mobile repo) to new unified neatnotesapp.com platform. Decommission neatnotes-web and neatnotes-landing as separate surfaces. Update mobile app to point to new URLs. |

---

## Feature Detail

*Add detail entries below as features are scoped. Use the template provided.*

---

### F001 — All Tastings Page Revamp
**Area:** Tasting
**Priority:** Low
**Release Target:** v1.0.8
**Complexity:** Low
**Risk:** Low
**Status:** ✅ Done

**Description:**
Full visual revamp shipped May 7, 2026. FlatList replaced with ScrollView + fixed sticky header, eliminating the header duplication scroll bug. Each tasting row is now a standalone glass card with whiskey type shown in amber italic and rating in an amber-bordered badge. Header card removed — search and sort controls inlined into compact sticky header. Query updated to join whiskeys table for whiskey_type per row. Confirmed working on device.

---

```
### FXXX — Feature Name
**Area:** [Events / Profile / Analytics / Tasting / Venue / UX / Infrastructure]
**Priority:** High / Medium / Low          ← MANDATORY
**Release Target:** vX.X / Backlog         ← MANDATORY
**Complexity:** Low / Medium / High        ← MANDATORY
**Risk:** Low / Medium / High              ← MANDATORY
**Status:** 💡 Idea

**Description:**
What the feature does and why it matters to users or the business.

**Scope / Requirements:**
- Requirement 1
- Requirement 2

**Open Questions:**
- Any unknowns that need resolving before scoping is complete

**Dependencies:**
- Any other features, fixes, or infrastructure this depends on

**References:**
- Screenshots, links, issue numbers, Figma URLs

**Notes:**
Additional context, inspiration, or implementation ideas.
```

---

### F018 — Shareable Flavor Profile Card
**Area:** UX
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Generate a branded shareable image card from the user's Flavor Profile — stops the scroll on Instagram and Facebook. Serves as organic marketing while giving users a meaningful artifact of their tasting identity.

**Scope / Requirements:**
- 9:16 portrait (Stories) and 1:1 square (Feed post)
- Flavor radar chart, Palate Clarity score, top/avoided traits, personalized tagline, Neat Notes branding
- Dark, rich aesthetic — editorial quality
- Export as PNG/JPEG to native share sheet
- Replace current "copy text" share behavior entirely

**Dependencies:**
- F019 Insights revamp — card should reflect updated data model

---

### F039 — App Store / Play Store Review Prompt
**Area:** UX
**Priority:** High
**Release Target:** v1.0.8
**Complexity:** Low
**Risk:** Low
**Status:** ✅ Done

**Description:**
Prompts users to rate the app after reaching 5 tastings. Native system review sheet — no custom UI. Fires on cold open after threshold. One-time only via review_prompted_at on profiles table. useRef guard prevents StrictMode double-fire.

---

### F048 — Custom Whiskey Submission Flow Redesign
**Area:** Tasting
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Remove canonical slug from user-facing form (auto-generate from name). Replace free-text classification fields with taxonomy-backed dropdowns. MVP required fields: Name, Proof, Whiskey Type only — everything else optional.

**Dependencies:**
- Taxonomy tables must be fully populated before dropdowns can be wired
- Admin candidate review screen unchanged

---

### F049 — Account Settings — Add / Change Phone Number
**Area:** Profile
**Priority:** High
**Release Target:** v1.0.8
**Complexity:** Low
**Risk:** Low
**Status:** ✅ Done

**Description:**
Phone management card in Account Settings. Add, change, or remove linked phone number. OTP verification required before linking. Critical bug fixed: verifyPhoneLinkOtp now writes profiles.phone (previously only updated Supabase auth, breaking check_phone_exists RPC for sign-in).

---

### F050 — Whiskey Card Revamp
**Area:** Tasting
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Full redesign of the whiskey profile card — currently shows basic bottle info but nothing about the user's personal relationship with the whiskey. Revamp makes it a rich personal record of every pour.

**Scope / Requirements:**
- Personal tasting history for that whiskey — dates, ratings, trend over time
- Log Again shortcut — visible when user has 2+ tastings of that whiskey
- Richer bottle metadata — proof, age, distillery, region, whiskey type
- BHH review integration — show BHH score and review link if available
- Premium: community flavor profile (top flavors logged by all users)
- Premium: community average rating with tasting count

**Dependencies:**
- bhh_reviews table already populated
- whiskey_community_stats view already exists
- F053 — bottle images ideally available before this ships

---

### F051 — Paywall Analytics Instrumentation
**Area:** Analytics
**Priority:** High
**Release Target:** v1.0.8
**Complexity:** Low
**Risk:** Low
**Status:** ✅ Done

**Description:**
Full premium conversion funnel tracked in analytics_events. Non-premium users only. Enables post-1.0.8 analysis of awareness vs. pricing problem.

**Events:** insights_screen_viewed, purchase_tapped (with package_id), purchase_completed (with package_id), restore_completed.

**SQL funnel query:**
```sql
WITH funnel AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event_name = 'insights_screen_viewed' THEN user_id END) as viewed,
    COUNT(DISTINCT CASE WHEN event_name = 'purchase_tapped' THEN user_id END) as tapped,
    COUNT(DISTINCT CASE WHEN event_name = 'purchase_completed' THEN user_id END) as converted
  FROM analytics_events
)
SELECT viewed, tapped, converted,
  ROUND(tapped::numeric / NULLIF(viewed, 0) * 100, 1) as tap_rate_pct,
  ROUND(converted::numeric / NULLIF(tapped, 0) * 100, 1) as close_rate_pct
FROM funnel;
```

---

### F052 — Bulletproof Barcode Flow
**Area:** Infrastructure
**Priority:** High
**Release Target:** v1.0.8
**Complexity:** Medium
**Risk:** Low
**Status:** ✅ Done

**Description:**
Complete overhaul of the barcode scan → whiskey identification → database enrichment pipeline. Every scan path now either resolves immediately or builds toward a clean canonical record.

**What shipped May 7, 2026:**
- UPCitemdb title pre-populates search query on found (was silently discarded before)
- Raw barcode strings (8-14 digits) rejected as custom whiskey names via guard in onUseCustom
- Barcode param threaded through goToCustomTasting → cloud-tasting.tsx URL params
- Timing fix: pending_candidate barcode mapping now fires inside saveMetadataFromModal after maybeCreateWhiskeyCandidate returns the candidate ID (was firing before candidate existed — always a no-op)
- Schema: candidate_id column added to whiskey_barcodes with FK to whiskey_candidates
- save_barcode_mapping RPC updated to accept p_candidate_id, handle pending_candidate source
- admin_approve_and_promote_candidate RPC updated: resolves pending barcode mappings to canonical whiskey_id on merge/promote
- Dead backup file cloud-tasting.backup.tsx removed

**Verified paths:**
- Path A: barcode in whiskey_barcodes → instant match → log tasting ✅
- Path B: UPCitemdb finds it, whiskey in catalog → pre-populate search → user picks → barcode saved ✅
- Path C: UPCitemdb finds it, whiskey not in catalog → pre-populate → add custom → candidate created → barcode saved with candidate_id → admin promotes → barcode resolves to canonical whiskey_id ✅
- Path D: UPCitemdb doesn't find it → query cleared → user searches manually → same as B or C ✅

---

### F053 — Go-UPC Fallback + Bottle Images
**Area:** Infrastructure
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Two-part catalog enrichment project planned for v1.1.0. UPCitemdb trial tier is limited to 100 requests/day — a real constraint at scale. Go-UPC provides 45K+ requests/month at $19.95/month with strong spirits coverage. Bottle images from both services would significantly improve scan confirmation UX and whiskey card quality.

**Scope / Requirements:**

Part 1 — Go-UPC fallback in lookup-upc Edge Function:
- If UPCitemdb returns no result, call Go-UPC API as fallback
- Go-UPC response shape: `data.product.name`, `data.product.brand`, `data.product.imageUrl`
- Normalize to same `{ found, title, brand, image_url }` response shape
- Filter by whiskey keywords same as UPCitemdb path
- Requires Go-UPC API key stored as Supabase secret `GO_UPC_API_KEY`

Part 2 — Bottle image storage and display:
- Add `image_url text` column to `whiskeys` table
- Add `image_url text` column to `whiskey_candidates` table
- Return image_url from lookup-upc Edge Function when available
- Show bottle image on Log tab scan confirmation (before user selects/confirms)
- Show bottle image on whiskey profile card (F050 dependency)
- On candidate promote/merge, carry image_url to whiskeys table via RPC
- Do not store external image URLs permanently without caching strategy — evaluate Supabase Storage vs CDN proxy

Part 3 — UPC Data 4 Spirits bulk import:
- 16,500 true whiskey records from all over the world
- Vendor: Gregg London — gregg@glondon.com — 469-585-1961
- Agreed price: $1,750 for whiskey-only subset
- Includes extended descriptions, tasting notes, flavor data at no extra charge
- Quarterly updates included free year 1, $700/year after
- Delivery: Excel with SQL-compatible field names
- Pipeline: receive Excel → map fields → deduplicate vs existing catalog → import → run Go-UPC image pull for all new records

**Open Questions:**
- Should we proxy/cache bottle images in Supabase Storage or link directly to external URLs?
- What happens when an external image URL goes dead?
- Should image_url on whiskeys be admin-only editable or can users suggest corrections?

**Dependencies:**
- Go-UPC API key (sign up at go-upc.com, ~$19.95/month)
- F050 Whiskey Card Revamp — images should ship alongside the card revamp

---

### F054 — User Submit Edits for Whiskey Records
**Area:** Tasting
**Priority:** High
**Release Target:** v1.0.9
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Allow users to suggest corrections to canonical whiskey records — proof, age, distillery, region, whiskey type. Submissions go through admin review before being applied. Crowdsources missing data at scale, especially valuable after the UPC Data 4 Spirits bulk import where some fields may still be incomplete.

**Scope / Requirements:**
- "Suggest an edit" button on whiskey profile card — visible to all logged-in users
- Fields: proof, age, distillery, region, whiskey type (the five most commonly missing)
- Submission creates a review record in whiskey_cleanup_review or a dedicated edits table
- Admin review screen shows pending edits with approve/reject + current vs. suggested value diff
- On approve: applies the change to the canonical whiskeys record
- User gets no direct write access to canonical records — always through admin gate
- Optional: notify submitting user when their edit is approved

**Open Questions:**
- Use existing whiskey_cleanup_review table or create a dedicated whiskey_edit_suggestions table?
- Should we surface which fields are missing to prompt users specifically ("This whiskey is missing proof — do you know it?")?
- Gamification angle — acknowledge top contributors?

**Dependencies:**
- F053 / UPC Data 4 Spirits import — more valuable after bulk import creates records with partial data
- Missing data prompt (backlog) — could surface this naturally when a user logs a whiskey with gaps

---

### F055 — Fuzzy/Trigram Search for Whiskey Lookup
**Area:** Infrastructure
**Priority:** High
**Release Target:** v1.0.9
**Complexity:** Low
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Current search in `log.tsx` (`fetchSuggestions`) uses `ILIKE %substring%` — a user who types "lagovolin" instead of "Lagavulin" gets zero results and may create a duplicate custom record. With 12,701 whiskeys in the catalog, typo tolerance becomes a catalog quality issue, not just a UX nicety.

**Scope / Requirements:**
- Enable `pg_trgm` extension in Supabase (one-line SQL: `CREATE EXTENSION IF NOT EXISTS pg_trgm`)
- Add GIN trigram index: `CREATE INDEX whiskeys_display_name_trgm ON whiskeys USING GIN (display_name gin_trgm_ops)`
- Update `fetchSuggestions` in `app/(tabs)/log.tsx` to call a Supabase RPC or use `.rpc('search_whiskeys', { query })` that runs `word_similarity(query, display_name) > 0.3 ORDER BY word_similarity DESC`
- Minimum similarity threshold: 0.3 (tune based on testing — 0.4 may be too strict for short queries)
- Keep 20-result cap and BHH score re-ranking logic unchanged

**Open Questions:**
- Use RPC or PostgREST's built-in filter operators? (`cs`, `fts` don't cover trigram — RPC is cleaner)
- Should the GIN index also cover `whiskey_canonical` for future slug lookups?

**Dependencies:**
- None — self-contained DB + query change

---

### F056 — Whiskey Catalog Import (UPC Data 4 Spirits)
**Area:** Infrastructure
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** High
**Risk:** Medium
**Status:** ✅ Done (May 10, 2026)

**Description:**
Bulk import of the UPC Data 4 Spirits dataset (purchased from Gregg London, $1,750). Catalog grew from 1,161 to 12,701 active whiskeys — a 10x expansion. All records classified by whiskey_type, category, and region. 95.6% proof coverage. 13,080 UPC barcodes loaded and linked to whiskey records.

**Import Pipeline:**
1. `scripts/whiskey_import_classifier.py` — reads `working-whiskey.xlsx` (Liquor sheet, 16,668 rows), applies exclusions, deduplicates by POS_Name with size preference, maps country → category/region, classifies Name → whiskey_type_id. Outputs `whiskeys_staging.csv` (11,698 rows) and `barcodes_staging.csv`.
2. `scripts/load_staging.py` — loads staging CSV into `whiskey_import_staging` table via PostgREST REST API.
3. `scripts/fuzzy_match.py` — fuzzy-matches staging records against existing whiskeys catalog using `thefuzz` token_sort_ratio with (category, whiskey_type_id) composite key + first-word prefix filter. Thresholds: ≥90 = matched, ≥85 = review, <85 = new. 18 manual overrides applied post-match.
4. `scripts/enrich_matched.py` — enriches 70 existing whiskeys from matched staging records (27 proof updates, 165 barcodes added).
5. `scripts/promote_new.py` — inserts 11,596 new whiskeys and 13,080 barcodes using `on_conflict=whiskey_canonical` to handle slug collisions gracefully.

**Final Numbers:**
- Whiskeys before import: 1,161 → after: 12,701 (+10x)
- Barcodes before import: 2 → after: 13,080+
- Proof updates on existing records: 27
- Records needing manual review (fuzzy 85–89): 44

**Dependencies:**
- `whiskey_import_staging` table (already exists)
- `whiskey_barcodes` table with `barcode` unique constraint

---

### F057 — Search Relevance Ranking
**Area:** UX
**Priority:** High
**Release Target:** v1.0.9
**Complexity:** Low
**Risk:** Low
**Status:** 💡 Idea

**Description:**
With 12,701 whiskeys in the catalog, the current alphabetical search ranking is broken. Searching "Sazerac" surfaces obscure barrel selects before the standard Sazerac Rye because alphabetical order ignores relevance. Fix: replace `.order("display_name")` with an RPC that scores results by: (1) starts-with match +10 points, (2) shorter display_name ranked higher, (3) has community tastings +5 points, (4) alphabetical as final tiebreaker. Also reduce result limit from 10 to 7 to reduce noise.

**Scope / Requirements:**
- New Supabase RPC `search_whiskeys_ranked(query text)` that applies the scoring logic server-side
- Score breakdown: starts-with match +10, shorter name ranked higher, community tastings count > 0 +5, alphabetical as final tiebreaker
- Reduce result limit from 10 to 7
- Update `fetchSuggestions` in `app/(tabs)/log.tsx` to call the new RPC instead of `.order("display_name")`

**Dependencies:**
- F055 Fuzzy/Trigram Search — ranking complements typo tolerance; ideally ships together

---

### F058 — Web Platform Consolidation & Migration
**Area:** Website
**Priority:** High
**Release Target:** v1.0.9
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
We currently have two fragmented web surfaces with no single source of truth:
- **neatnotes-landing** — static HTML/CSS marketing site, hosted on Vercel, NOT Git-connected, lives on local C drive
- **neatnotes-web** — small Next.js app buried inside the mobile repo (WhiskeyAppBeta), handles auth callback + password reset only

The goal is to consolidate everything into one unified standalone web platform (F035) hosted at neatnotesapp.com. This feature tracks the migration work specifically — standing up the new platform, recreating the auth routes, updating the mobile app to point to the new URLs, and decommissioning the old surfaces.

**Scope / Requirements:**
- Create new standalone Next.js repo: `neatnotes-web-platform`
- Connect to GitHub and deploy to Vercel under neatnotesapp.com
- Recreate `/auth/callback` route (currently in neatnotes-web/app/auth/callback/CallbackClient.tsx)
- Recreate `/auth/reset` route (currently hardcoded to https://neatnotes-web.vercel.app/auth/reset on line 505 of sign-in.tsx)
- Test both auth routes thoroughly before cutting over mobile app
- Update sign-in.tsx line 505 to point to https://neatnotesapp.com/auth/reset
- Update any other mobile references to neatnotes-web.vercel.app
- Decommission neatnotes-web from the mobile repo (remove or archive the folder)
- neatnotes-landing static site: migrate content to new platform, then retire

**Migration Strategy (safe path — do not break production auth):**
1. Build new platform first
2. Recreate callback/reset routes and test thoroughly
3. Update mobile app in v1.0.9 to point to neatnotesapp.com routes
4. Only then decommission old surfaces

**Open Questions:**
- Does neatnotes-landing have any content not yet in the new platform scope?
- Are there any other hardcoded references to neatnotes-web.vercel.app beyond sign-in.tsx line 505?
- Should neatnotes-web folder be deleted from mobile repo or just archived?

**Dependencies:**
- F035 — unified platform must exist before migration can complete
- GoDaddy domain (neatnotesapp.com) already owned
- Vercel account already active
- Supabase already configured for auth callbacks

**Critical Dependency — Do Not Decommission Early:**
neatnotes-web.vercel.app MUST remain live and functional until v1.0.9 is in the App Store and adoption is high enough that no meaningful user base remains on v1.0.8 or older. v1.0.8 (submitted May 10, 2026) still hardcodes neatnotes-web.vercel.app/auth/reset for password reset. Decommissioning early will break password reset for all users on older builds. Safe decommission window: after v1.0.9 has been live in production for 60+ days.

---

## Section Indexes

### Events
- F003 — Surface query errors on Event page ✅ Done
- F025 — Upcoming Public Events Near You (v1.2.0)

### Profile
- F007 — Add user_id filters to profile queries (v1.1.0)
- F026 — Phone Number Sign-In ✅ Done
- F049 — Account Settings — Add / Change Phone Number ✅ Done

### Analytics
- F002 — Fix Host Analytics Event Snapshot metrics ✅ Done
- F013 — Align RPC limit with UI display (Backlog)
- F030 — Event Host Analytics Revamp (v1.1.1)
- F051 — Paywall Analytics Instrumentation ✅ Done

### Insights
- F019 — Insights Revamp ✅ Done
- F020 — Push Notification System (v1.1.0)
- F033 — Palate Clarity Unique Whiskey Calculation (v1.1.0)
- F034 — Whiskey Evolution Insights (v1.1.0)
- F038 — Claude "What Should I Drink?" Recommendation (v1.1.0)
- F040 — Pour Profile Tab ✅ Done
- F041 — Insights Summary Tab Restructure ✅ Done
- F042 — Hero Card with Here's Why Bullets ✅ Done
- F045 — Whiskey Type Correlation Insights (v1.1.0)

### Tasting
- F001 — All Tastings Page Revamp ✅ Done
- F009 — Fix null guard on avg_rating ✅ Done
- F017 — Enforce minimum rating floor (Backlog)
- F031 — Delete Tasting from Edit Flow ✅ Done
- F032 — Log Again from Previous Tasting ✅ Done
- F037 — Bottle Collection Tracker (v1.1.0)
- F048 — Custom Whiskey Submission Flow Redesign (v1.1.0)
- F050 — Whiskey Card Revamp (v1.1.0)
- F054 — User Submit Edits for Whiskey Records (v1.0.9)

### Venue
- F005 — Fix hardcoded venue data fallbacks ✅ Done
- F027 — Venue Check-In Foundation (v1.1.1)
- F028 — Venue Host Analytics Dashboard (v1.1.2)
- F029 — B2B Venue Owner Access & Monetization (v1.1.2)
- F044 — Bar / Venue Menu Feature (v1.1.1) 🔍 Scoped
- F046 — Palate Match for Venue Menus (v1.1.2)

### Discover
- F023 — Bars Nearby with Your Whiskey (v1.2.0)
- F024 — Top Whiskey Bars in Your Area (v1.2.0)

### UX
- F016 — Fix "Save failed" title for validation errors (Backlog)
- F018 — Shareable Flavor Profile Card (v1.1.0)
- F022 — Nearby Whiskey Alerts (v1.2.0)
- F039 — App Store / Play Store Review Prompt ✅ Done
- F057 — Search Relevance Ranking (v1.0.9)

### Infrastructure
- F004 — Verify personal_notes in public mirror ✅ Done
- F006 — Investigate Exposed Auth Users views ✅ Done
- F008 — Add ownership checks to update/delete (v1.1.0)
- F010 — Replace .single() with .maybeSingle() (v1.1.0)
- F011 — Move category breakdown to server-side RPC (v1.1.0)
- F012 — Fix route type casting (Backlog)
- F014 — Remove console.log from production ✅ Done
- F015 — Fix insights hooks re-fetch on user change (Backlog)
- F021 — Location Platform Foundation (v1.2.0)
- F043 — Fix L1 Flavor Sentiment Inference ✅ Done
- F047 — SMS Consent Text + Twilio Resubmission ✅ Done
- F052 — Bulletproof Barcode Flow ✅ Done
- F053 — Go-UPC Fallback + Bottle Images (v1.1.0)
- F055 — Fuzzy/Trigram Search for Whiskey Lookup (v1.0.9)
- F056 — Whiskey Catalog Import (UPC Data 4 Spirits) ✅ Done

### Website
- F035 — Core Marketing Site (Website)
- F036 — Public Events Finder (Website — depends on F021 Location Platform)
- F058 — Web Platform Consolidation & Migration (v1.0.9)

---

## Release Milestones

| Milestone | Release Date | Theme | Status | Key Features |
|---|---|---|---|---|
| v1.0.0 | Mar 6, 2026 | Initial release | ✅ Done | Sensory Profile section, texture/proof intensity signals, public tastings mirror, insights tab redesign foundation |
| v1.0.0-nav-fix | Mar 7, 2026 | iOS navigation hotfix | ✅ Done | Fix iOS router blocking on font loading, Clarity deep dive dashboard, hero card/driver tiles |
| v1.0.3 | Mar 8–9, 2026 | Analytics & production prep | ✅ Done | Radar analytics pipeline, reaction hydration fix, home polish, insights CTA logic, admin candidate work |
| v1.0.4 | Mar 20, 2026 | Monetization & catalog | ✅ Done | Admin dashboard improvements, whiskey merge flow, metrics & logging, admin catalog, featured bottle system, tasting UX improvements, RevenueCat wiring, RevenueCat monetization + premium gating on Insights |
| v1.0.5 | Mar 23, 2026 | Premium Insights | ✅ Done | Premium Insights launch, lifetime vs 90d clarity system, recommendations |
| v1.0.6 | Apr 3, 2026 | Barcode & UX | ✅ Internal Only | Barcode scan, review prompt, RevenueCat UUID sync, event candidate work — tested internally, never pushed to public |
| v1.0.7 | May 1, 2026 | Events system | 🧪 Testing | Event system: check-in flow, event page refactor, host view, Supabase sync |
| v1.0.8 | TBD | Auth revamp, UX polish, barcode, analytics | 🔨 In Progress | All Tastings revamp, auth revamp (confirm password, two-step verification, phone sign-in), account settings phone management, app store review prompt, paywall analytics funnel, single-tap actions on recent tastings, category mix → whiskey_type, bulletproof barcode flow, duplicate email fix, change phone fix, Log Again inline, insights analytics premium gate, nav bar fix (unstable_settings + font gate), whiskey catalog import groundwork |
| v1.0.9 | TBD | Security, web consolidation & catalog quality | 💡 Planning | Web consolidation neatnotes-web → neatnotesapp.com, user submit edits for whiskey records (F054), schema security, web platform consolidation (F058) |
| v1.1.0 | TBD | Intelligence, Catalog & Social | 💡 Planning | Whiskey card revamp, Hero Card, Go-UPC fallback + bottle images, shareable flavor profile card, push notifications, custom whiskey submission redesign, whiskey type correlation insights |
| v1.1.1 | TBD | Venue Foundation & Analytics Revamp | 💡 Planning | Venue check-in infrastructure, tastings mapped to venues, event host analytics revamp, Bar/Venue Menu feature |
| v1.1.2 | TBD | B2B Monetization | 💡 Planning | Venue owner analytics dashboard, B2B access & subscription model, Palate Match for venue menus |
| v1.2.0 | TBD | Location Platform | 💡 Planning | Location foundation, nearby whiskey alerts, bar discovery fed by venue data, event discovery by location |
| Website | TBD | Web Presence | 💡 Planning | Core marketing site + public events finder (events finder depends on v1.2.0 location platform) |
| Backlog | — | Unscheduled ideas | — | |

---

## Change Log

| Date | Update |
|---|---|
| May 12, 2026 | F058 added — Web Platform Consolidation & Migration (v1.0.9). F035 updated to reflect unified platform vision. |
| May 10, 2026 | F057 added — Search Relevance Ranking (v1.0.9) |
| May 10, 2026 | F056 added — Whiskey catalog import ✅ Done. 12,701 whiskeys, 13,080 barcodes |
| May 10, 2026 | F055 added — Fuzzy/trigram search (v1.0.9) |
| May 10, 2026 | Catalog import complete: 11,596 new whiskeys promoted, 13,080 barcodes loaded |
| May 10, 2026 | All pre-import data cleanup complete: 83 Other/Other fixes, 63 type fixes, 75 whiskey_name mismatches resolved, Angel's Envy merge, Lagavulin 16 merge |
| May 10, 2026 | Nav bar root cause identified and fixed: unstable_settings + font gate |
| May 10, 2026 | v1.0.8 submitted to App Store |
| May 10, 2026 | New iOS + Android builds in progress with nav bar fix |
| May 7, 2026 | F054 added — User Submit Edits for Whiskey Records (v1.0.9) |
| May 7, 2026 | F053 updated — UPC Data 4 Spirits details added (Gregg London, $1,750, 16,500 records) |
| May 7, 2026 | F052 added — Bulletproof Barcode Flow ✅ Done |
| May 7, 2026 | F053 added — Go-UPC Fallback + Bottle Images (v1.1.0) |
| May 7, 2026 | F052 shipped — UPC pre-population, barcode threading, timing fix, candidate_id schema, RPC updates |
| May 7, 2026 | Testing plan completed — blockers resolved: change phone fix, duplicate email, insights analytics gate, Log Again inline, barcode double-record |
| May 7, 2026 | F051 added — Paywall Analytics Instrumentation (confirmed live, double-fire fixed) |
| May 7, 2026 | F050 added — Whiskey Card Revamp (v1.1.0, includes Log Again) |
| May 7, 2026 | F001 confirmed ✅ Done on device — glass cards, whiskey type, scroll architecture fixed |
| May 7, 2026 | F049 confirmed ✅ Done — phone management fully built, profiles.phone write bug fixed |
| May 7, 2026 | Category mix chart switched from category to whiskey_type |
| May 7, 2026 | Single-tap actions shipped on Log tab + Profile tab recent tastings |
| May 7, 2026 | Paywall analytics double-fire fixed — useRef guard in InsightsScreen.tsx |
| May 6, 2026 | Auth revamp shipped — confirm password, two-step verification choice, phone linked at sign-up, finishSignIn cleanup |
| May 6, 2026 | F048 added — Custom Whiskey Submission Flow Redesign |
| May 6, 2026 | F049 added — Account Settings phone number management |
| May 6, 2026 | F026 updated — status → In Progress, target → v1.0.8 |
| May 6, 2026 | Section indexes updated — F040–F047 added to all relevant sections |
| May 6, 2026 | F009 release target cleared (✅ Done, no active milestone) |
| May 6, 2026 | F014 corrected in Infrastructure index from Backlog to ✅ Done |
| May 5, 2026 | F040–F047 added to feature table |
| May 2026 | Milestones seeded, document created |
