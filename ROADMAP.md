WhiskeyAppBeta — Feature Ideas & Roadmap

> Last updated: May 2026  
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
| F001 | All Tastings Page Revamp | Tasting | Low | v1.0.8 | Low | Low | 🧪 Testing | Scroll layering bug + full visual redesign of the tastings list view |
| F002 | Fix Host Analytics Event Snapshot metrics (C2) | Analytics | High | v1.0.8 | Low | Low | ✅ Done | Summary metrics computed from 12-row slice — wrong for events with >12 tastings |
| F003 | Surface query errors on Event page (M3) | Events | Medium | v1.0.8 | Low | Low | ✅ Done | Silent failures show empty UI with no user feedback when queries fail |
| F004 | Verify personal_notes in public mirror (M4) | Infrastructure | Medium | v1.0.8 | Low | Medium | ✅ Done | personal_notes written to public_tastings — confirm intent and restrict if unintentional |
| F005 | Fix hardcoded venue data fallbacks (M6) | Venue | Medium | v1.0.9 | Low | Low | ✅ Done | Empty pour/bottle size fields write fabricated 1oz/750ml values to venue DB |
| F006 | Investigate Exposed Auth Users views (DB1/DB2) | Infrastructure | High | v1.0.9 | Low | Medium | ✅ Done | tastings_with_email and analytics_activation views may expose user emails |
| F007 | Add user_id filters to profile queries (C1) | Profile | Low | v1.1.0 | Low | Low | 💡 Idea | 5 profile queries missing user_id filter — mitigated by RLS but should be fixed |
| F008 | Add ownership checks to update/delete (C3/M1) | Infrastructure | Low | v1.1.0 | Low | Low | 💡 Idea | Update and delete paths missing user_id check — mitigated by RLS |
| F009 | Fix null guard on avg_rating (C4/L5) | Tasting | Low | v1.1.0 | Low | Low | 💡 Idea | .toFixed(1) on nullable avg_rating + fix type definition |
| F010 | Replace .single() with .maybeSingle() (M2) | Infrastructure | Low | v1.1.0 | Low | Low | 💡 Idea | Spurious errors logged for new users with no metrics data |
| F011 | Move category breakdown to server-side RPC (M5) | Infrastructure | Low | v1.1.0 | Medium | Low | 💡 Idea | 3000-row client-side fetch for a simple bar chart — needs server aggregation |
| F012 | Fix route type casting (L1) | Infrastructure | Low | Backlog | Low | Low | 💡 Idea | as any casts suppress Expo Router compile-time route checking |
| F013 | Align RPC limit with UI display (L2) | Analytics | Low | Backlog | Low | Low | 💡 Idea | RPC fetches 10 top whiskies, UI shows 5 — align to avoid wasted network call |
| F014 | Remove console.log from production (L3) | Infrastructure | Low | Backlog | Low | Low | 💡 Idea | console.log("90d metrics") left in useClarityInsightsData.ts |
| F015 | Fix insights hooks re-fetch on user change (L4) | Infrastructure | Low | Backlog | Low | Low | 💡 Idea | Hooks don't re-fetch when session changes — stale data can persist |
| F016 | Fix "Save failed" title for validation errors (L6) | UX | Low | Backlog | Low | Low | 💡 Idea | Validation errors show "Save failed" implying network issue |
| F017 | Enforce minimum rating floor (L7) | Tasting | Low | Backlog | Low | Low | 💡 Idea | Rating 0 is submittable — decide on minimum valid rating and enforce it |
| F018 | Shareable Flavor Profile Card | UX | High | v1.1.0 | Medium | Low | 💡 Idea | Branded shareable image card (Stories + Square) with radar chart, Palate Clarity score, top traits, and personalized tagline |
| F019 | Insights Revamp | Insights | High | v1.1.0 | High | Medium | 💡 Idea | Dynamic Claude-powered Summary, actionable Palate Clarity recommendations, updated Flavor Profile with Texture/Proof, new Palate DNA tab |
| F020 | Push Notification System | Infrastructure | High | v1.1.0 | Medium | Low | 💡 Idea | Weekly palate check-ins, palate score updates, milestone alerts (50 tastings, Refining tier, etc.) with Whoop-style retention model |
| F021 | Location Platform Foundation | Infrastructure | High | v1.2.0 | High | Medium | 💡 Idea | Enable location permissions, core location infrastructure, privacy controls — foundation for all location-based features |
| F022 | Nearby Whiskey Alerts | UX | Medium | v1.2.0 | Medium | Low | 💡 Idea | Push notification when a favorited whiskey is logged nearby by another user |
| F023 | Bars Nearby with Your Whiskey | Discover | Medium | v1.2.0 | Medium | Low | 💡 Idea | Find bars serving whiskies that match your flavor profile and favorites |
| F024 | Top Whiskey Bars in Your Area | Discover | Medium | v1.2.0 | Medium | Low | 💡 Idea | Curated bar discovery ranked by community ratings and whiskey selection |
| F025 | Upcoming Public Events Near You | Events | Medium | v1.2.0 | Low | Low | 💡 Idea | Event discovery surface driven by user location — find tastings, pours, and whiskey events nearby |
| F026 | Phone Number Integration | Profile | Medium | v1.1.0 | Medium | Low | 💡 Idea | Phone as auth layer, friend finding via contacts, social sharing via SMS — foundation for social graph |
| F027 | Venue Check-In Foundation | Venue | High | v1.1.1 | High | Medium | 💡 Idea | Core venue check-in infrastructure — tastings mapped to venues, venue profiles, check-in flow |
| F028 | Venue Host Analytics Dashboard | Venue | High | v1.1.2 | Medium | Low | 💡 Idea | Real-time analytics for venue owners — popular pours, visitor counts, tasting trends. B2B revenue feature |
| F029 | B2B Venue Owner Access & Monetization | Infrastructure | High | v1.1.2 | Medium | Medium | 💡 Idea | Gated analytics access sold to venue/bar/restaurant owners — subscription or one-time access model |
| F030 | Event Host Analytics Revamp | Analytics | High | v1.1.1 | Medium | Low | 💡 Idea | Revamp existing event host analytics to be richer and more actionable — foundation shared with venue analytics |
| F031 | Delete Tasting from Edit Flow | Tasting | Low | v1.0.8 | Low | Low | ✅ Done | Add Delete option when tapping Edit on a tasting — action sheet with Edit, Delete, Cancel instead of going straight to edit form |
| F032 | Log Again from Previous Tasting | Tasting | Medium | v1.0.8 | Low | Low | ✅ Done | "Log again" shortcut on tastings with 2+ records — prompts user to use previous ratings or start fresh, prepopulates whiskey details, defaults to today's date |
| F033 | Palate Clarity Unique Whiskey Calculation | Insights | High | v1.1.0 | Medium | Medium | 💡 Idea | Recalculate Palate Clarity and core insights using unique whiskey records only — prevents inflation from logging the same bottle repeatedly |
| F034 | Whiskey Evolution Insights | Insights | Medium | v1.1.0 | Medium | Low | 💡 Idea | Track how perception of the same whiskey changes over time across multiple logs — first pour vs. mid-bottle vs. last dram. Unique differentiator vs. other apps |
| F035 | Website — Core Marketing Site | Website | High | Website | Medium | Low | 💡 Idea | Formal Neat Notes website — app download CTAs, feature overview, brand story |
| F036 | Website — Public Events Finder | Website | High | Website | Medium | Low | 💡 Idea | Public-facing table/map of upcoming whiskey events near the visitor — drives app downloads, great SEO. Requires F021 Location Platform |
| F037 | Bottle Collection Tracker | Tasting | High | v1.1.0 | Medium | Low | 💡 Idea | Track personal whiskey collection — add via manual entry or barcode scan, bottle status (sealed/open/half/nearly gone/finished), ties to existing tasting records |
| F038 | Claude "What Should I Drink?" Recommendation | Insights | High | v1.1.0 | Medium | Low | 💡 Idea | Natural language prompt against your collection — type the notes you want to taste, Claude cross-references your collection and tasting history to recommend what to pour tonight. Sorted by your historical ratings. Secondary market pricing as nice-to-have. |
| F039 | App Store / Play Store Review Prompt | UX | High | v1.0.8 | Low | Low | 💡 Idea | Prompt users to rate the app after reaching 5 tastings. Uses expo-store-review (already installed). Fires on next cold open after threshold — not inline. One-time only via review_prompted_at on profiles table. |

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
**Status:** 💡 Idea

**Description:**
The "All Tastings" list view feels utilitarian and unpolished compared to the rest of the app. Reported by beta user (Mike) — the layout feels clunky, the search box has a z-index/layering issue where tasting rows scroll behind it rather than beneath it cleanly, and the overall page lacks the visual warmth and hierarchy present elsewhere in the app.

**Current Issues:**
- Tasting rows scroll behind the search box instead of under it cleanly
- Search bar and sort dropdown feel like placeholder UI with no visual refinement
- "26 / 26" count reads like a debug label — needs better treatment
- Tasting rows are barebones (name, rating, date, chevron only) with no visual differentiation
- No card styling, warmth, or glass aesthetic consistent with the rest of the app

**Scope / Requirements:**
- Fix scroll layering so rows pass cleanly beneath the sticky search/sort header
- Redesign tasting row cards with richer visual treatment (rating display, whiskey type indicator, etc.)
- Improve search bar and sort control styling to match app aesthetic
- Replace or reframe the count display
- Consider sticky header polish — shadow, blur, or glass effect on scroll

**Open Questions:**
- Should tasting rows show additional metadata (whiskey type, distillery, flavor tags)?
- Should the sort control be a segmented control or stay as a dropdown?
- Is there a desired empty state design?

**References:**
- Screenshot from Mike (beta user) — May 1, 2026 — shows scroll layering issue and overall layout

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

### F018 — Shareable Flavor Profile Card
**Area:** UX
**Interface:** Flavor Profile (Insights)
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Generate a gorgeous, branded shareable image card from the user's Flavor Profile that stops the scroll on Instagram and Facebook — whether the viewer drinks whiskey or not. Serves as organic marketing for Neat Notes while giving users a meaningful artifact of their tasting identity.

**Scope / Requirements:**
- Render as both 9:16 portrait (Stories) and 1:1 square (Feed post)
- Content includes:
  - User's name (e.g., "Derek's Flavor Profile")
  - Flavor radar chart rendered as a clean graphic
  - Palate Clarity score (e.g., 58/100)
  - Top traits + avoided traits
  - Personalized tagline (e.g., "You lean sweet and fruity")
  - Neat Notes logo/wordmark branding
- Dark, rich aesthetic matching the app — should feel premium and editorial
- Export as PNG/JPEG to native share sheet (Instagram, Facebook, etc.)
- Replace current "copy text" share behavior entirely

**Open Questions:**
- Should the card reflect 90-day data or lifetime data?
- Should the radar chart style match exactly what's in-app or be a more stylized/simplified version for shareability?
- Should there be seasonal or milestone variants (e.g., "50 tastings" special card)?

**Dependencies:**
- F019 (Insights revamp with Flavor Intensity, Proof Intensity, Texture) — card should reflect updated data model

**References:**
- Screenshots of current Flavor Profile tab — May 1, 2026
- Current share feature just copies text — no image generation

**Notes:**
Goal is "stop the scroll" quality. Should look stunning to someone who has never heard of whiskey. Think editorial magazine aesthetic, not app screenshot.

### F039 — App Store / Play Store Review Prompt
**Area:** UX
**Priority:** High
**Release Target:** v1.0.8
**Complexity:** Low
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Prompt users to rate the app on the App Store or Google Play after they reach 5 tastings. Uses the native iOS/Android system review sheet — no custom UI. Designed to catch users at a meaningful early milestone without being intrusive.

**Scope / Requirements:**
- Trigger: user reaches 5 tastings (check on cold open, not immediately after save)
- One-time only — store a `review_prompted_at` timestamp in the `profiles` table to prevent re-prompting
- Use `expo-store-review` (already installed as a dependency — currently unused)
- Call `StoreReview.isAvailableAsync()` before requesting — no-op if unavailable (simulator, unsupported device)
- Fire on the next cold open after the threshold is crossed, not mid-session
- No custom UI — relies entirely on the native system review sheet

**Implementation Notes:**
- Add `review_prompted_at` column (timestamptz, nullable) to the `profiles` table in Supabase
- On app launch, after home stats load: if `tastingCount >= 5` and `review_prompted_at` is null, call `StoreReview.requestReview()` and write the current timestamp to `review_prompted_at`
- Natural hook point: `app/(tabs)/home.tsx` already loads `tastingCount` via `useHomeStats` — post-load effect is the right place

**Open Questions:**
- Should the threshold be 5 tastings or a different number?
- Should we re-prompt after a major milestone (e.g., 50 tastings) with a separate flag?

**Dependencies:**
- Supabase `profiles` table must have `review_prompted_at` column added before shipping

### Events
- F003 — Surface query errors on Event page (v1.0.8)
- F025 — Upcoming Public Events Near You (v1.2.0)

### Profile
- F007 — Add user_id filters to profile queries (v1.1.0)
- F026 — Phone Number Integration (v1.1.0)

### Analytics
- F002 — Fix Host Analytics Event Snapshot metrics (v1.0.8)
- F013 — Align RPC limit with UI display (Backlog)
- F030 — Event Host Analytics Revamp (v1.1.1)

### Insights
- F019 — Insights Revamp with Claude + Palate DNA tab (v1.1.0)
- F020 — Push Notification System (v1.1.0)
- F033 — Palate Clarity Unique Whiskey Calculation (v1.1.0)
- F034 — Whiskey Evolution Insights (v1.1.0)
- F038 — Claude "What Should I Drink?" Recommendation (v1.1.0)

### Tasting
- F001 — All Tastings Page Revamp (v1.0.8)
- F009 — Fix null guard on avg_rating (v1.1.0)
- F017 — Enforce minimum rating floor (Backlog)
- F031 — Delete Tasting from Edit Flow (v1.0.8)
- F032 — Log Again from Previous Tasting (v1.0.8)
- F037 — Bottle Collection Tracker (v1.1.0)

### Venue
- F005 — Fix hardcoded venue data fallbacks (v1.0.9)
- F027 — Venue Check-In Foundation (v1.1.1)
- F028 — Venue Host Analytics Dashboard (v1.1.2)
- F029 — B2B Venue Owner Access & Monetization (v1.1.2)

### Discover
- F023 — Bars Nearby with Your Whiskey (v1.2.0)
- F024 — Top Whiskey Bars in Your Area (v1.2.0)

### UX
- F016 — Fix "Save failed" title for validation errors (Backlog)
- F018 — Shareable Flavor Profile Card (v1.1.0)
- F022 — Nearby Whiskey Alerts (v1.2.0)
- F039 — App Store / Play Store Review Prompt (v1.0.8)

### Infrastructure
- F004 — Verify personal_notes in public mirror (v1.0.8)
- F006 — Investigate Exposed Auth Users views (v1.0.9)
- F008 — Add ownership checks to update/delete (v1.1.0)
- F010 — Replace .single() with .maybeSingle() (v1.1.0)
- F011 — Move category breakdown to server-side RPC (v1.1.0)
- F012 — Fix route type casting (Backlog)
- F014 — Remove console.log from production (Backlog)
- F015 — Fix insights hooks re-fetch on user change (Backlog)
- F021 — Location Platform Foundation (v1.2.0)

### Website
- F035 — Core Marketing Site (Website)
- F036 — Public Events Finder (Website — depends on F021 Location Platform)

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
| v1.0.8 | TBD | Bug fixes & audit remediation | 💡 Planning | All Tastings revamp, host analytics fix, silent error handling, personal_notes verification |
| v1.0.9 | TBD | Security & data integrity | 💡 Planning | Exposed auth views investigation, hardcoded venue fallbacks fix |
| v1.1.0 | TBD | Social & Integration | 💡 Planning | Phone number integration, Claude-powered Insights revamp, Palate DNA tab, shareable flavor profile card, push notifications |
| v1.1.1 | TBD | Venue Foundation & Analytics Revamp | 💡 Planning | Venue check-in infrastructure, tastings mapped to venues, event host analytics revamp |
| v1.1.2 | TBD | B2B Monetization | 💡 Planning | Venue owner analytics dashboard, B2B access & subscription model |
| v1.2.0 | TBD | Location Platform | 💡 Planning | Location foundation, nearby whiskey alerts, bar discovery fed by venue data, event discovery by location |
| Website | TBD | Web Presence | 💡 Planning | Core marketing site + public events finder (events finder depends on v1.2.0 location platform) |
| Backlog | — | Unscheduled ideas | — | |

---

## Change Log

| Date | Update |
|---|---|
| May 2026 | Document created |
| May 2026 | Milestones seeded from GitHub tag history (v1.0.0 through v1.0.7) |
| May 2026 | F019–F026 added — Insights revamp, push notifications, location platform, phone integration, shareable cards |
| May 2026 | Milestones updated through v1.2.0 with themed release arcs |
