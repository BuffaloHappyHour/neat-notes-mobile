WhiskeyAppBeta — Feature Ideas & Roadmap

> Last updated: June 2, 2026  
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
| F010 | Replace .single() with .maybeSingle() (M2) | Infrastructure | Low | v1.1.0 | Low | Low | ✅ Done | Spurious errors logged for new users with no metrics data |
| F011 | Move category breakdown to server-side RPC (M5) | Infrastructure | Low | v1.1.0 | Medium | Low | 💡 Idea | 3000-row client-side fetch for a simple bar chart — needs server aggregation |
| F012 | Fix route type casting (L1) | Infrastructure | Low | Backlog | Low | Low | 💡 Idea | as any casts suppress Expo Router compile-time route checking |
| F013 | Align RPC limit with UI display (L2) | Analytics | Low | Backlog | Low | Low | 💡 Idea | RPC fetches 10 top whiskies, UI shows 5 — align to avoid wasted network call |
| F014 | Remove console.log from production (L3) | Infrastructure | Low | — | Low | Low | ✅ Done | console.log("90d metrics") left in useClarityInsightsData.ts |
| F015 | Fix insights hooks re-fetch on user change (L4) | Infrastructure | Low | Backlog | Low | Low | 💡 Idea | Hooks don't re-fetch when session changes — stale data can persist |
| F016 | Fix "Save failed" title for validation errors (L6) | UX | Low | Backlog | Low | Low | ✅ Done | Validation errors show "Save failed" implying network issue |
| F017 | Enforce minimum rating floor (L7) | Tasting | Low | Backlog | Low | Low | 💡 Idea | Rating 0 is submittable — decide on minimum valid rating and enforce it |
| F018 | Shareable Flavor Profile Card | UX | High | v1.1.0 | Medium | Low | 💡 Idea | Branded shareable image card (Stories + Square) with radar chart, Palate Clarity score, top traits, and personalized tagline |
| F019 | Insights Revamp | Insights | High | v1.0.8 | High | Medium | ✅ Done | Summary tab restructured, Pour Profile tab added, Flavor Map renamed, Hero Card shipped. |
| F020 | Push Notification System | Infrastructure | High | v1.1.0 | Medium | Low | ✅ Done | Weekly Friday pour reminders (12-message rotation), behavioral milestone triggers (3 tastings, 10 tastings, 7-day inactive, premium nudge), opt-out preference controls per notification type. Edge Functions deployed, pg_cron scheduled. |
| F021 | Location Platform Foundation | Infrastructure | High | v1.2.0 | High | Medium | 💡 Idea | Enable location permissions, core location infrastructure, privacy controls — foundation for all location-based features |
| F022 | Nearby Whiskey Alerts | UX | Medium | v1.2.0 | Medium | Low | 💡 Idea | Push notification when a favorited whiskey is logged nearby by another user |
| F023 | Bars Nearby with Your Whiskey | Discover | Medium | v1.2.0 | Medium | Low | 💡 Idea | Find bars serving whiskies that match your flavor profile and favorites |
| F024 | Top Whiskey Bars in Your Area | Discover | Medium | v1.2.0 | Medium | Low | 💡 Idea | Curated bar discovery ranked by community ratings and whiskey selection |
| F025 | Upcoming Public Events Near You | Events | Medium | v1.2.0 | Low | Low | 💡 Idea | Event discovery surface driven by user location — find tastings, pours, and whiskey events nearby |
| F026 | Phone Number Sign-In | Profile | High | v1.0.8 | Medium | Low | ✅ Done | Phone auth layer shipped. Sign-in: phone + OTP for users with linked number. Sign-up phone-first path redesigned May 18, 2026 — see F093. |
| F027 | Venue Check-In Foundation | Venue | High | v1.1.3 | High | Medium | ✅ Done | Core venue check-in infrastructure — tastings mapped to venues, venue profiles, check-in flow |
| F028 | Venue Host Analytics Dashboard | Venue | High | v1.1.2 | Medium | Low | 💡 Idea | Real-time analytics for venue owners — popular pours, visitor counts, tasting trends. B2B revenue feature |
| F029 | B2B Venue Owner Access & Monetization | Infrastructure | High | v1.1.2 | Medium | Medium | ✅ Done | Gated analytics access sold to venue/bar/restaurant owners — subscription or one-time access model |
| F030 | Event Host Analytics Revamp | Analytics | High | v1.1.1 | Medium | Low | ✅ Done | Revamp existing event host analytics to be richer and more actionable — foundation shared with venue analytics.  Should include exportable PDF. |
| F031 | Delete Tasting from Edit Flow | Tasting | Low | v1.0.8 | Low | Low | ✅ Done | Add Delete option when tapping Edit on a tasting — action sheet with Edit, Delete, Cancel instead of going straight to edit form |
| F032 | Log Again from Previous Tasting | Tasting | Medium | v1.0.8 | Low | Low | ✅ Done | "Log again" shortcut on tastings with 2+ records — available in All Tastings actions sheet, expands inline |
| F033 | Palate Clarity Unique Whiskey Calculation | Insights | High | v1.1.2 | Medium | Medium | 💡 Idea | Recalculate Palate Clarity and core insights using unique whiskey records only — prevents inflation from logging the same bottle repeatedly |
| F034 | Whiskey Evolution Insights | Insights | Medium | v1.1.2 | Medium | Low | 💡 Idea | Track how perception of the same whiskey changes over time across multiple logs — first pour vs. mid-bottle vs. last dram. Unique differentiator vs. other apps |
| F035 | Website — Core Marketing Site | Website | High | Website | Medium | Low | ✅ Done | Unified web platform — official marketing site, auth/callback/reset handler, future admin portal and partner dashboard. One repo, one domain, one source of truth under neatnotesapp.com. |
| F036 | Website — Public Events Finder | Website | High | Website | Medium | Low | 💡 Idea | Public-facing table/map of upcoming whiskey events near the visitor — drives app downloads, great SEO. Requires F021 Location Platform |
| F037 | Bottle Collection Tracker | Tasting | High | v1.1.0 | Medium | Low | 💡 Idea | Track personal whiskey collection — add via manual entry or barcode scan, bottle status (sealed/open/half/nearly gone/finished), ties to existing tasting records |
| F038 | Claude "What Should I Drink?" Recommendation | Insights | High | v1.1.2 | Medium | Low | 💡 Idea | Natural language prompt against your collection — type the notes you want to taste, Claude cross-references your collection and tasting history to recommend what to pour tonight. |
| F039 | App Store / Play Store Review Prompt | UX | High | v1.0.8 | Low | Low | ✅ Done | Prompt users to rate the app after reaching 5 tastings. Fires on next cold open. One-time only via review_prompted_at. useRef guard prevents double-fire. |
| F040 | Pour Profile Tab | Insights | High | v1.0.8 | Medium | Low | ✅ Done | New Insights tab showing Proof Point classification, perception bar charts for Texture/Proof/Flavor with sweet spot and gap insights. |
| F041 | Insights Summary Tab Restructure | Insights | High | v1.0.8 | Medium | Low | ✅ Done | Summary rebuilt into 6 sections: Identity Header, What to Try Next, Here's Why chips, Palate Snapshot 2x2 grid, Flavor Fingerprint, Coach's Note. |
| F042 | Hero Card with Here's Why Bullets | Insights | High | v1.0.8 | High | Low | ✅ Done | Hero Card built and shipped in v1.0.8. Single amber-bordered card with horizontal scrollable Safe Pick + Stretch Pick cards, Here's Why data-backed bullets, and tab navigation chips. Stretch Pick driven by whiskey_type_affinity gap logic — targets types user has never or rarely tried. Safe Pick driven by recommendation_rules. Both cards use accent/accentPressed color hierarchy. |
| F043 | Fix L1 Flavor Sentiment Inference | Infrastructure | High | v1.0.8 | Low | Low | ✅ Done | When user selects L2/L3 LIKE nodes, parent L1 now correctly infers LIKE via hasLikedDescendant() walk. |
| F044 | Bar / Venue Menu Feature | Venue | High | v1.1.3 | High | Medium | ✅ Done | Venue page with filterable whiskey menu, community ratings, out-of-stock flagging. Premium: Palate Match score. First use case: Hartman's Speakeasy. Shipped v1.1.3 — Hartman's Barrel Room fully imported (342 whiskeys, 1oz/2oz pricing), filterable menu with community ratings, live check-in count, share deeplink, dynamic last updated stat. |
| F045 | Whiskey Type Correlation Insights | Insights | High | v1.1.2 | Medium | Low | 💡 Idea | Surface insights like "you prefer high proof Single Malts over Bourbon" using whiskey_type_id joined with tastings and ratings. |
| F046 | Palate Match for Venue Menus | Venue | High | v1.1.2 | High | Medium | 💡 Idea | Premium feature on venue menu pages. Match user flavor profile + pour preferences against whiskey community flavor data. |
| F047 | SMS Consent Text + Twilio Resubmission | Infrastructure | High | v1.0.8 | Low | Low | ✅ Done | TCPA-compliant consent disclosure added. Twilio toll-free verified ✅ May 6, 2026. |
| F048 | Custom Whiskey Submission Flow Redesign | Tasting | High | v1.1.3 | Medium | Low | ✅ Done | Remove canonical slug, replace classification fields with taxonomy dropdowns, MVP required fields: Name, Proof, Whiskey Type only. Shipped v1.1.3 — Bottle details section fully editable via Suggest Edits mode. All 8 fields inline editable (distillery, category, region, sub-region, style, proof, age, mash bill). Edits stored in whiskey_edit_suggestions table for admin review. Camera + photo library upload. Taxonomy dropdowns in Help Improve section. |
| F049 | Account Settings — Add / Change Phone Number | Profile | High | v1.0.8 | Low | Low | ✅ Done | Phone management card: add, change, remove linked phone. OTP verification required. profiles.phone write bug fixed. |
| F050 | Whiskey Card Revamp | Tasting | High | v1.1.0 | Medium | Low | ✅ Done | Full redesign of whiskey profile card — tasting history, Log Again shortcut (2+ tastings), richer bottle metadata, BHH review integration, premium community flavor data. |
| F051 | Paywall Analytics Instrumentation | Analytics | High | v1.0.8 | Low | Low | ✅ Done | insights_screen_viewed, purchase_tapped, purchase_completed, restore_completed tracked in analytics_events. Non-premium only. Double-fire fixed via useRef guard. |
| F052 | Bulletproof Barcode Flow | Infrastructure | High | v1.0.8 | Medium | Low | ✅ Done | UPC pre-population from lookup-upc title, barcode threaded through custom tasting flow, pending_candidate mapping fires after maybeCreateWhiskeyCandidate returns, RPC resolves on promote/merge. Schema: candidate_id added to whiskey_barcodes. |
| F053 | Go-UPC Fallback + Bottle Images | Infrastructure | High | v1.1.0 | Medium | Low | 💡 Idea | Add Go-UPC as fallback lookup when UPCitemdb returns nothing. Pull bottle images from both services. Add image_url to whiskeys + whiskey_candidates tables. Show bottle image on scan confirmation and whiskey card. UPC Data 4 Spirits: 16,500 whiskey records, $1,750 (Gregg London, gregg@glondon.com). |
| F054 | User Submit Edits for Whiskey Records | Tasting | High | v1.1.3 | Medium | Low | ✅ Done | Allow users to suggest corrections to proof, age, distillery, region, whiskey type on canonical whiskey records. Goes through admin review before applying. Crowdsources missing data at scale. |
| F055 | Fuzzy/Trigram Search for Whiskey Lookup | Infrastructure | High | v1.0.9 | Low | Low | ✅ Done | Current search uses ILIKE %substring% — no typo tolerance. A user typing "lagovolin" gets no results and creates a duplicate custom record. Fix: enable pg_trgm extension, add GIN index on whiskeys.display_name, update search query in log.tsx to use similarity() or word_similarity() instead of ILIKE. Directly protects catalog data quality now that we have 12,701 whiskeys. |
| F056 | Whiskey Catalog Import (UPC Data 4 Spirits) | Infrastructure | High | v1.1.0 | High | Medium | ✅ Done (May 10, 2026) | Bulk import of 11,596 whiskeys and 13,080 UPC barcodes from working-whiskey.xlsx (UPC Data 4 Spirits dataset). Catalog grew from 1,161 to 12,701 active whiskeys. All records classified by whiskey_type, category, region. 95.6% proof coverage. Import pipeline: classification script → staging table → fuzzy dedup against existing catalog → enrich matched records → promote new records → load barcodes. Scripts: whiskey_import_classifier.py, fuzzy_match.py, enrich_matched.py, promote_new.py. |
| F057 | Search Relevance Ranking | UX | High | v1.0.9 | Low | Low | ✅ Done | With 12,701 whiskeys in the catalog, alphabetical search ranking is broken — "Sazerac" surfaces obscure barrel selects before standard Sazerac Rye. Fix: replace .order("display_name") with an RPC scoring starts-with +10pts, shorter name ranked higher, has community tastings +5pts, alphabetical as tiebreaker. Also reduce result limit from 10 to 7. |
| F058 | Web Platform Consolidation & Migration | Website | High | v1.0.9 | Medium | Low | ✅ Done | Migrate auth/callback + password reset from neatnotes-web (buried in mobile repo) to new unified neatnotesapp.com platform. Decommission neatnotes-web and neatnotes-landing as separate surfaces. Update mobile app to point to new URLs. App code confirmed pointing to neatnotesapp.com as of May 18, 2026 audit. |
| F059 | Admin Dashboard Redesign | Admin | High | v1.0.9 | Medium | Low | ✅ Done | Full premium dark redesign — new component library (SectionDivider, MetricBarRow, PowerGrid, TotalChip), status colors aligned to design tokens, amber accent bars on cards |
| F060 | Admin Dashboard — New KPIs & Monetization Tab | Admin | High | v1.0.9 | Low | Low | ✅ Done | New Monetization tab (premium users, premium %, avg tastings by tier), 5-tier input adoption card, Pour source breakdown card, Unlinked tastings KRI, source_type values corrected to match actual data |
| F061 | Admin Reject RPC — Orphaned Tasting Fix | Admin/Infra | High | v1.0.9 | Low | Low | ✅ Done | admin_reject_candidate now accepts optional p_merge_into_whiskey_id — re-links orphaned tastings on reject, logs unfixable orphans to client_logs |
| F062 | Fuzzy Duplicate Detection RPC | Infra | High | v1.0.9 | Low | Low | ✅ Done | find_duplicate_whiskey_candidates using pg_trgm — catches near-duplicate whiskey names at review time and submission time. GIN trigram index added on display_name |
| F063 | search_whiskeys RPC | Infra | High | v1.0.9 | Low | Low | ✅ Done | Relevance-sorted whiskey search — prefix match first, trigram similarity second, alphabetical tiebreaker. Replaces ILIKE-only search. Type filter support built in |
| F064 | Log Screen — Full-Screen Search Modal | UX | High | v1.0.9 | Medium | Low | ✅ Done | WhiskeySearchModal — full-screen slide modal with rich result cards (distillery, type badge, proof, region, age), dynamic type filter chips loaded from DB, fuzzy fallback section, safe area aware footer, relevance sorted |
| F065 | Log Screen — Submission-Time Duplicate Detection | UX/Infra | High | v1.0.9 | Low | Low | ✅ Done | Fuzzy match fallback in search modal — shows "Did you mean one of these?" before user can submit a candidate. Forces explicit selection on fuzzy results. Prevents duplicate catalog entries at source |
| F066 | Candidate Review — Duplicate Detection Panel | Admin | Medium | v1.1.0 | Medium | Low | ✅ Done | Wire find_duplicate_whiskey_candidates into the candidate review screen — surface top 5 fuzzy matches before admin sees Approve button. Prevent duplicate promotions at the review stage |
| F067 | Candidate Review — Merge Target on Reject | Admin | Medium | v1.1.0 | Low | Low | ✅ Done | Update reject UI to accept a merge target whiskey — passes p_merge_into_whiskey_id to admin_reject_candidate RPC so orphaned tastings are re-linked automatically without manual SQL |
| F068 | Candidate Review — Pre-Promotion Metadata Validation | Admin | Medium | v1.1.0 | Low | Low | ✅ Done | Block Approve button until whiskey_type is set to a valid non-Other value. Show inline validation warning before promotion |
| F069 | Whiskey Profile Page Rework | UX | High | v1.1.0 | High | Low | ✅ Done | Full rework of the whiskey/:id screen users land on after searching — better layout, prominent log tasting CTA, community data, tasting history, metadata display. Replaces F050 scope or merges with it |
| F070 | Catalog Duplicate Audit — Bulk Brands | Infra | Medium | Backlog | Medium | Low | 💡 Idea | Run same duplicate detection and cleanup process across remaining high-volume brands — Ardbeg, Buffalo Trace, Glenfiddich likely have same import-doubling issues as the 41 pairs cleaned today |
| F071 | Export Analytics Report | Analytics | High | v1.1.1 | Medium | Low | ✅ Done | Post-event PDF/HTML analytics report generated from event tasting data. Delivered to hosts via "Export Analytics" button on the event host dashboard. Canonical format is colonial-event-report.html/.pdf. |
| F072 | Create HOST and EVENT HOST role | Admin/Infra | High | v1.0.9 | Medium | Low | ✅ Done | Role infrastructure is complete: user_roles table, app_role enum (admin, host_starter, host_pro, venue_starter, venue_pro, retail_partner, brand_pilot, enterprise), admin_grant_role / admin_revoke_role RPCs, useRoles hook, roleSync lib. Self-serve Stripe billing and full tier enforcement (feature gating by role in-app) are still pending. |
| F073 | "Pairing involved" option for EVENT HOSTS | Events | Medium | v1.0.9 | Medium | Low | ✅ Done | This would allow an event host to add in any pairings (food, cigars, etc) to the event page.  Attendees could have the option to give sentiment on the pairing |
| F074 | Header Title Audit | UX | Medium | v1.0.9 | Low | Low | 💡 Idea | Audit all screens for raw path-based header titles (e.g. "host-events/index", "(tabs)"). Set explicit title in stack screen options for every route. |
| F075 | Create Event Form | Events | High | v1.0.9 | Medium | Low | ✅ Done | Two-step event creation form. Step 1: name, event type pill selector, start/end date picker. Step 2: description, blind tasting toggle, public toggle, tier-gated attendee cap (free=10, host_starter=25, host_pro=50). Writes to events table with host_user_id, join_code auto-generated by DB trigger. |
| F076 | My Events Landing Screen | Events | High | v1.0.9 | Medium | Low | ✅ Done | Host-facing event list screen at /host-events. Shows all events where host_user_id = current user. Event cards with name, date, status badge (Upcoming/Active/Ended), blind badge, attendee cap. Empty state with Create Event CTA. |
| F077 | Host an Event Profile CTA | UX | High | v1.0.9 | Low | Low | ✅ Done | "Host an Event" card on Profile screen placed between InsightsCTA and Journal Snapshot. Visible to all authenticated users. Routes to /host-events. |
| F078 | Role Management Admin Screen | Admin | High | v1.0.9 | Low | Low | ✅ Done | Admin screen at /admin/roles. Email search via admin_lookup_user_by_email RPC. Grant/revoke any app_role via toggle pills. Protected by isAdmin() check. Admin index redesigned with amber accent bars, icon-left layout, chevron affordance, scroll fix. |
| F079 | Venue Request Admin Screen | Admin | High | v1.0.9 | Low | Low | ✅ Done | Admin screen at /admin/venue-requests. Review pending venue applications, approve with role assignment (venue_starter or venue_pro), reject with confirmation. Pull-to-refresh, empty state, auth guard. RPCs: admin_approve_venue_request, admin_reject_venue_request. |
| F082 | QR Code Event Sharing | Events | High | v1.1.0 | Medium | Low | ✅ Done | Host generates branded QR code (amber, NN logo) from event detail screen. Attendee scans → deep links into app → auto-joins via join_event RPC → lands on event page. Save to camera roll. Universal link handler in _layout.tsx. |
| F083 | Event Location / Venue | Events | High | v1.1.0 | Medium | Low | ✅ Done | Host searches venues table during event creation, or enters manually. Linked venue shows full details on host and attendee screens. event_attendees table added for attendance tracking. |
| F084 | Home Screen Redesign | UX | High | v1.1.0 | High | Low | ✅ Done | Modular hub replacing dashboard — Palate Identity Card, Insights Preview teaser, Quick Actions, Recommendations Rail, Community Pulse, Featured Whiskey |
| F085 | Guided New User Onboarding | UX | High | v1.1.0 | Medium | Low | ✅ Done | 3-slide outcome-focused intro flow shown on first launch — logged once in Supabase/AsyncStorage, never re-shown |
| F086 | "What's New" Modal (v1.1.0) | UX | High | v1.1.0 | Low | Low | ✅ Done | Full-screen dismissible modal shown once to existing users after v1.1.0 install — highlights Home redesign, Insights on Home, Google Sign-In |
| F087 | Google Sign-In | Profile | High | v1.1.0 | Medium | Low | ✅ Done | Google as primary auth option via Supabase signInWithOAuth — links to existing account if email matches, never creates ghost accounts. Code committed May 18, 2026 via expo-auth-session + PKCE/implicit flow. Pending production build. |
| F088 | Phone Auth Analytics Events | Infrastructure | Medium | Backlog | Low | Low | 💡 Idea | Fire phone_auth_started, phone_auth_completed, phone_auth_duplicate_detected analytics events for SMS auth monitoring |
| F089 | Duplicate Auth Detection View | Admin | Medium | Backlog | Low | Low | 💡 Idea | admin_duplicate_auth_candidates Supabase view — surfaces auth accounts created within 48h sharing name or device metadata |
| F090 | Insights Teaser on Home + Milestone Cards | Insights | High | v1.1.0 | Medium | Low | ✅ Done | 2 palate trait teasers on Home (visible to all), premium CTA for full breakdown, milestone cards at 5 and 15 tastings computed server-side |
| F091 | Recommendations Foundation | Insights | High | v1.1.0 | Medium | Low | ✅ Done | get_recommendations_for_user RPC using L2/L3 flavor + whiskey_type_id overlap — powers Home rail with "Because you liked…" suggestions |
| F092 | Community Pulse Modules | UX | Medium | v1.1.0 | Medium | Low | 💡 Idea | Trending bottles (last 7 days, min 3 logs) and highest rated (min 5 logs) on Home — anonymous aggregates from materialized Supabase views |
| F093 | Phone-First Signup Flow Redesign | Profile | High | v1.1.0 | Medium | Low | ✅ Done | Phone-first signup: OTP creates account with phone as primary identity, email + password linked after verification. Email-only fallback if no phone provided. signInWithOtp (shouldCreateUser: true) + linkIdentity email + updateUser password. Ghost-account bug fixed (sendSignUpOtp uses updateUser not signInWithOtp). Shipped May 18, 2026. |
| F094 | Sign in with Apple | Profile | High | v1.1.2 | Low | Low | ✅ Done | Required by Apple Guideline 4.8 — must be offered as equivalent login option alongside any third-party auth. Blocks App Store approval if missing. |
| F095 | Notification Tap Navigation | Infrastructure | High | v1.1.2 | Low | Low | ✅ Done | Route notification taps to correct in-app screens based on notification type. Milestone/premium nudge → Insights screen. Scheduled/inactive → Log tab. Requires data payload on each push message and Notifications.addNotificationResponseReceivedListener in _layout.tsx. |
| F096 | Weekly Palate Clarity Update System | Insights | High | v1.1.2 | Medium | Low | 🔍 Scoped | Whoop-style weekly palate update backend and UI. New view: user_metrics_90d_current (90-day rolling window, Depth 30% + Diversity 20% + Preference Patterns 30% + Confidence 20%). New table: user_metric_weekly_snapshots. New view: user_metric_weekly_trends_current (deltas, biggest driver, weekly_movement_status). pg_cron job: every Sunday 13:00 UTC. App UI card reading from user_metric_weekly_trends_current showing weekly movement and biggest driver. Backend complete — app UI card still needed. |
| F097 | Whiskey Card Revamp + Related Whiskey Features | Tasting | High | v1.1.2 | High | Low | ✅ Done | Full whiskey feature release: Whiskey Card revamp (F050), Go-UPC fallback + bottle images (F053), user submit edits for whiskey records (F054), whiskey profile page rework (F069). Consolidates all whiskey-surface improvements into one focused release. |
| F098 | Pending Whiskey Verification System | Tasting | High | v1.1.3 | Medium | Low | ✅ Done | Custom whiskeys inserted directly into whiskeys table with status=pending instead of whiskey_candidates. Redirects to whiskey detail page post-save. Pending Verification badge on detail page. Admin inbox Pending Whiskeys tab. RLS insert policy for authenticated users. |
| F099 | Venue Menu Management | Venue | High | v1.2.0 | Medium | Medium | ✅ Done | Self-service menu management for venue owners — add/edit/remove whiskeys, update 1oz/2oz pricing, mark items available or out of stock, without requiring admin intervention. Foundation for B2B venue owner value prop. |
| F100 | Event Monthly Cap Enforcement | Infrastructure | High | v1.1.4 | Medium | Medium | ✅ Done | Server-side monthly event creation cap by role. Starter: 2 events/calendar month. Pro: 5 events/calendar month. Reset on 1st of each month. |
| F101 | Server-Side Attendee Cap Enforcement | Infrastructure | High | v1.1.4 | Medium | Medium | ✅ Done | Move attendee cap enforcement from client to server. RPC or DB trigger validates max_attendees before allowing join. Currently client-side only — bypassable. |
| F102 | Join-Time Attendee Cap Check | Infrastructure | High | v1.1.4 | Low | Low | ✅ Done | Gate join_event RPC to reject if current attendee count >= max_attendees. Currently no server-side check at join time. |
| F103 | Premium Expiration Notifications | Infrastructure | High | v1.1.2 | Low | Low | 💡 Idea | RevenueCat webhook for EXPIRATION, CANCELLATION, BILLING_ISSUE events. Push and email to affected user. Pre-expiration email 3 days before expiry with resubscribe CTA. |
| F104 | Email Infrastructure — Resend + Webhook | Infrastructure | High | v1.1.0 | Low | Low | ✅ Done | Resend transactional email configured on neatnotesapp.com. send-activation-email edge function deployed. resend-webhook edge function deployed. email_events table capturing delivered/opened/clicked/bounced per recipient. Cron scheduled daily at 12pm UTC. |
| F105 | Activation Email | Growth | High | v1.1.0 | Low | Low | ✅ Done | Branded HTML email to users with zero tastings 48h after signup. Personalised by first name. Deep links to neatnotes://log via neatnotesapp.com/open redirect page. Deduplicates via sent_behavioral_notifications. 89 users reached on first blast, 27% open rate. |
| F106 | /open Deep Link Redirect Page | Infrastructure | High | v1.1.0 | Low | Low | ✅ Done | Next.js page at neatnotesapp.com/open. Detects iOS/Android/desktop, fires deep link with optional route param (e.g. ?route=insights), falls back to App Store or Play Store after 1500ms if app not installed. |
| F107 | Premium Nudge Email | Growth | High | v1.1.1 | Low | Low | 💡 Idea | One-time email to free users with 3+ tastings. Personalised tease of their palate data with premium unlock CTA. 69 users eligible at launch. Threshold: 3 tastings (lower than Segment D push at 5 — email is lower friction). |
| F108 | First Tasting Milestone Email | Growth | Medium | v1.1.1 | Low | Low | 💡 Idea | Triggered 1 hour after a user's first tasting save. Celebrates the milestone and previews what insights will unlock as they log more. |
| F109 | Monthly Free User Digest | Growth | Medium | v1.1.1 | Medium | Low | 💡 Idea | Monthly email to free users with 1+ tastings. Personalised recap: pours logged, top whiskey, dominant flavor note, top-rated pour. CTA to premium for full profile. Cadence: monthly (median user logs less than once per week — weekly would be repetitive). |
| F110 | Weekly Premium Digest | Growth | High | v1.1.1 | Medium | Low | 💡 Idea | Weekly email to premium users. Richer than monthly digest — includes palate trend, avg proof, nose/taste alignment, personalized recommendations. Cadence: weekly (premium users log more frequently and expect more value). |
| F111 | Lapsed User Email — First Touch | Growth | High | v1.1.1 | Low | Low | 💡 Idea | Email to users with 1+ tastings who have not logged in 30 days. Personalised with their last logged whiskey and a recommendation based on their palate. |
| F112 | Lapsed User Email — Second Touch | Growth | Medium | v1.1.2 | Low | Low | 💡 Idea | Follow-up to F111 for users still inactive at 60 days. Different subject line and angle — community-focused ("here's what people with your palate have been logging"). |
| F113 | Neat Notes Wrapped 2026 | Growth | High | v1.2.0 | High | Low | 💡 Idea | Annual year-in-review email. Free users get real data with premium tease (blurred palate evolution section, upgrade CTA). Premium users get full unredacted version. All users with 0-2 tastings get aspirational version. CTA: "Premium members get this every week." Ship December 2026. |
| F114 | Funnel Snapshot Trendlines | Infrastructure | Medium | v1.1.1 | Low | Low | ✅ Done | funnel_snapshots table stores daily acquisition funnel metrics. acquisition-funnel-report edge function upserts daily snapshot and appends delta strings (vs yesterday, vs 7d) to Slack report. Trendlines populate after day 2. |
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

**2026-07-09 correction:** The `candidate_id`/`pending_candidate` wiring above (`saveMetadataFromModal` → `maybeCreateWhiskeyCandidate` → `save_barcode_mapping`) was dropped when `cloud-tasting.tsx`'s custom-whiskey save path was rebuilt around the `create_custom_whiskey` RPC — `usePostSaveMetadata` and `whiskeyCandidates.service.ts` are no longer called from that screen, and `routeBarcode` was captured from the URL param but never read again. Also, `found:false` from `lookup-upc` (true no-match, not just "found but not in catalog") had no client handling at all — user was left on the Log tab with no feedback. Both gaps fixed 2026-07-09: `log.tsx` now opens `WhiskeySearchModal` on `found:false`/fetch errors too, and `cloud-tasting.tsx` now calls `save_barcode_mapping` directly with `p_whiskey_id` (source `user_custom_entry`) once `create_custom_whiskey` resolves an id — bypassing the orphaned candidate-id path entirely rather than reviving it. Whether `whiskeyCandidates.service.ts` / `usePostSaveMetadata` should be deleted is still open (nothing else in the repo calls them, confirmed via full-repo grep — see below).

**2026-07-09 correction #2 — Path B was never actually saving, either:** Real-world test the same day showed `whiskey_barcodes` getting zero new rows even for the "pick an existing catalog whiskey after a scan" path (`handleSearchSelect`), which predates today's changes entirely — confirmed via `whiskey_barcodes` having no new rows from *any* source in the prior two months. Root cause: `save_barcode_mapping` has had two overloads in Postgres since the `p_candidate_id` param was added (see "Schema" line above) — a 6-arg one and a 7-arg one. Every call site (including the `handleSearchSelect` call this doc calls "✅" and the new `create_custom_whiskey` call added earlier today) passed exactly the original 6 named params, which PostgREST accepts as a valid match for *both* overloads and therefore rejects outright with an HTTP 300 "ambiguous function" (`PGRST203`) instead of running either one — confirmed via Postgres `pg_proc` introspection and live API logs showing `POST .../rpc/save_barcode_mapping` returning 300 at the exact moment of the test. The failure was swallowed by a non-fatal `console.log` in both call sites, so nothing broke visibly. Fixed by explicitly passing `p_candidate_id: null` in both RPC calls, which only exists on the 7-arg overload and so forces an unambiguous match — no schema change needed. Path B and the original `handleSearchSelect` path should both be re-verified against a fresh (never-before-scanned) barcode now that this is fixed.

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

### F071 — Export Analytics Report
**Area:** Analytics
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Host-facing post-event analytics report generated on demand from Supabase event data, delivered as a downloadable PDF with HTML source. Transforms raw tasting data into a polished, partner-ready document. The canonical format is already designed and proven — colonial-event-report.html/.pdf is the reference template.

**Scope / Requirements:**
- "Export Analytics" button on event host dashboard (role: host/admin only)
- Supabase Edge Function `generate-event-report` queries: events, public_tastings + whiskeys (per-bottle counts + avg ratings), tasting_flavor_selections_v2 + flavor_nodes_v2 (L1/L2 flavor signals), tastings (blind head-to-head data where applicable)
- Report sections: Header (logo, event name, venue, date), Stats row (tasters/tastings/bottles), Lineup Rankings table with score bars, Blind Tasting Results panel (conditional — only if event had blind pours), Key Takeaways 2×2 grid, Flavor Signal pills (L1 solid, L2 italic/serif), Partner Summary block, Footer
- Output: HTML rendered server-side → PDF via WeasyPrint → returned as file download
- Brand: Cormorant Garamond headings, Montserrat body, #BE9663 amber, #F4F1EA warm cream bg, NN_Icon_Transparent.png embedded as base64 in header + footer
- Takeaway copy: templated from data signals for v1.1.0 (Claude API generation is a v1.2.0 candidate)

**Open Questions:**
- Auto-email to host after event ends, or on-demand only?
- "Preview in browser" before download?
- Should partner summary be editable by host before export?

**Dependencies:**
- F030 Event Host Analytics Revamp — Export button lives on the host dashboard
- Blind tasting data must be resolved (placeholder → real whiskey IDs) before blind panel generates correctly
- NN_Icon_Transparent.png stored in Supabase Storage or bundled with Edge Function

---

### F084 — Home Screen Redesign
**Area:** UX
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** High
**Risk:** Low
**Status:** ✅ Done

**Description:**
Replaces the current dashboard-style Home with a modular intelligence hub. Positions Neat Notes as a palate identity platform rather than a tasting journal.

Shipped May 19, 2026. Palate Identity Card with clarity score, tier progression, top affinities. Insights CTA consolidated into palate card — premium shows View Insights, free shows Unlock Premium Insights with blurred preview. Two-slot recommendations rail — slot 0 type-based always visible, slot 1 flavor-based blurred and locked for free users. Featured Bottle card. Getting Started banner removed. Duplicate InsightsCTA removed.

**Scope / Requirements:**
- Palate Identity Card — top flavor affinities, palate clarity score, tasting streak. Absorbs existing stat tiles (total logs, avg rating)
- Insights Preview — 2 teaser traits, "See full breakdown" CTA gated by RevenueCat entitlement "premium"
- Quick Actions — Log Tasting + Scan Bottle, always visible, never gated
- Recommendations Rail — horizontal scroll, "Because you liked…" label, powered by F091. Placeholder state if <5 tastings
- Community Pulse — trending bottles + highest rated this week, powered by F092
- Featured Whiskey — single highlighted bottle card, editorial or algorithm-picked
- All Supabase data via RPCs or views — no raw table queries from the component
- Use only typography.ts and theme.ts for styling

**Dependencies:**
- F090 — Insights teaser content
- F091 — Recommendations Rail data
- F092 — Community Pulse data

---

### F085 — Guided New User Onboarding
**Area:** UX
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** ✅ Done

**Description:**
3-slide intro flow shown only on first launch. Outcome-focused — not a feature dump. Establishes the core identity loop early.

Shipped May 19, 2026.

**Scope / Requirements:**
- Slide 1: "Log what you taste" — outcome framing
- Slide 2: "We learn your palate" — emphasize the app gets smarter over time
- Slide 3: "Discover who you are as a taster" — identity hook
- Completion stored in Supabase user prefs or AsyncStorage — never re-shows
- Must not show to users who already have tastings (existing users upgrading)

**Dependencies:**
- Must not conflict with F086 — users who see onboarding should not also see What's New

---

### F086 — "What's New" Modal (v1.1.0)
**Area:** UX
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Low
**Risk:** Low
**Status:** 💡 Idea

**Description:**
One-time full-screen modal shown to existing users after upgrading to v1.1.0. Communicates the shift to palate intelligence platform — not just UI changes.

**Scope / Requirements:**
- Full-screen, dismissible
- Highlights: Home redesign, Insights on Home, Google Sign-In
- Version check against app version from expo-constants stored in AsyncStorage
- Do not show to users who just completed F085 new user onboarding
- Shown once only — dismissed state persisted in AsyncStorage

---

### F087 — Google Sign-In
**Area:** Profile
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Reduce cold-user auth friction. Google as the primary option on the auth screen — above email, above SMS.

**Scope / Requirements:**
- Use Supabase signInWithOAuth for Google
- If Google email matches an existing account, link to it — no duplicate creation
- Google Sign-In must never create a standalone account without an email
- Email/password remains required for account creation
- Phone auth can authenticate but must not create accounts on its own

**Notes:**
- RevenueCat sync on Google Sign-In must follow existing lib/premiumSync.ts pattern
- RevenueCat configuration belongs in _layout.tsx

---

### F088 — Phone Auth Analytics Events
**Area:** Infrastructure
**Priority:** Medium
**Release Target:** v1.1.0
**Complexity:** Low
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Instrument SMS auth flow to track ghost-user creation risk and auth funnel health.

**Scope / Requirements:**
- Fire phone_auth_started when OTP is requested
- Fire phone_auth_completed when OTP is verified successfully
- Fire phone_auth_duplicate_detected when phone auth appears to match an existing email account
- Use existing analytics utility — do not add a new event tracking layer

---

### F089 — Duplicate Auth Detection View
**Area:** Admin
**Priority:** Medium
**Release Target:** v1.1.0
**Complexity:** Low
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Read-only Supabase view for admin use to surface potential ghost-user pairs — email + phone accounts created close together that likely belong to the same person.

**Scope / Requirements:**
- View or RPC named admin_duplicate_auth_candidates
- Logic: auth accounts created within 48h of each other sharing display name or device metadata (if available)
- Read-only — no writes
- RLS: admin role only

---

### F090 — Insights Teaser on Home + Milestone Cards
**Area:** Insights
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** ✅ Done

**Description:**
Drives organic premium conversion by making palate intelligence visible on Home before users navigate to Insights.

Shipped May 19, 2026. Unlock CTA consolidated into palate card. Copy: Your first insights are already forming. Paywall navigation wired from both unlock entry points — palate card CTA and blurred recommendation card.

**Scope / Requirements:**
- 2 palate trait teasers on Home — visible to all users, not gated
- "Unlock full breakdown" CTA gated by RevenueCat entitlement "premium"
- Milestone cards on Home:
  - "Your palate is starting to form" — at 5 tastings
  - "Clear preferences emerging" — at 15 tastings
- Milestone logic computed in Supabase function/view — not client-side
- Milestone cards link to Insights screen
- Tie to push notifications if infrastructure exists (F020)

**Rules:**
- L2/L3 flavor notes are the primary signal — L1 fallback only
- Do not mix L1 and L2/L3 in the same insight
- whiskey_type_id preferred over broad category for any type-based signals

**Dependencies:**
- F020 — Push Notification System (for milestone notification trigger)
- F084 — Home Redesign (cards live here)

---

### F091 — Recommendations Foundation
**Area:** Insights
**Priority:** High
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** ✅ Done

**Description:**
SQL-based similarity engine powering the Home recommendations rail. No ML required for v1 — pure flavor and type overlap is enough to ship something real.

Shipped May 19, 2026. buildRecommendations in useHomeStats.ts. Slot 0: user most-logged whiskey_type, falls back to whiskey_community_stats for new users. Slot 1: first flavor-affinity RPC result deduplicated against slot 0. recommendationBasis field drives reason strings in UI.

**Scope / Requirements:**
- Supabase RPC: get_recommendations_for_user(user_id uuid)
- Input signals: user's top L2/L3 flavor affinities + top whiskey_type_id
- Logic: find users with similar profiles, return highly rated bottles this user hasn't logged
- Returns max 10 results: bottle_id, name, distillery, avg_community_rating, match_reason (text label)
- RPC must respect RLS — only anonymous/aggregate cross-user data
- Placeholder state on Home rail if user has <5 tastings: "Log more tastings to unlock recommendations"

**Dependencies:**
- F084 — Home Redesign (rail lives here)

---

### F092 — Community Pulse Modules
**Area:** UX
**Priority:** Medium
**Release Target:** v1.1.0
**Complexity:** Medium
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Makes the app feel alive and social without requiring user profiles or follows. Anonymous community aggregate data surfaced on Home.

**Scope / Requirements:**
- Trending this week: most-logged bottles in last 7 days, minimum 3 logs to surface
- Highest rated: community avg rating, minimum 5 logs to surface
- Both modules backed by Supabase views (materialized or scheduled refresh) — never computed in app
- Anonymous aggregates only — no user data exposed

**Dependencies:**
- F084 — Home Redesign (modules live here)

---

### F100 — Event Monthly Cap Enforcement
**Area:** Infrastructure
**Priority:** High
**Release Target:** v1.1.4
**Complexity:** Medium
**Risk:** Medium
**Status:** 💡 Idea

**Description:**
Enforce monthly event creation caps by role at the server level to match pricing model. Starter: 2 events per calendar month. Pro: 5 events per calendar month. Free: unlimited (attendee cap is the gate). Reset on the 1st of each calendar month.

**Scope / Requirements:**
- New column events_this_month on user_roles or a dedicated monthly_event_counts table
- DB trigger or RPC check on event creation that rejects if count >= tier cap
- Cap values: host_starter=2, host_pro=5, no cap for free (attendee cap governs)
- Calendar month reset via pg_cron job on 1st of month at 00:00 UTC
- Return clear error message to client: "You've reached your monthly event limit. Upgrade to Host Pro for more events."

**Dependencies:**
- F101 server-side attendee cap (ship together as pricing gate milestone)
- Pricing doc update to reflect confirmed caps: Starter 2/mo, Pro 5/mo

**Notes:**
Pricing model confirmed caps: Starter=2, Pro=5. These match the commercial pricing document. Do not use rolling 30-day window — calendar month is simpler to build and easier for users to understand.

---

### F101 — Server-Side Attendee Cap Enforcement
**Area:** Infrastructure
**Priority:** High
**Release Target:** v1.1.4
**Complexity:** Medium
**Risk:** Medium
**Status:** 💡 Idea

**Description:**
Move attendee cap enforcement from client-side to server-side. Currently tierCap is calculated in app/host-events/create.tsx and written to max_attendees at event creation, but nothing prevents a technical user from bypassing the cap at join time or event creation.

**Scope / Requirements:**
- Add server-side check in event creation RPC or trigger: reject if requested max_attendees exceeds tier allowance (host_starter=25, host_pro=50, free=10)
- Validate against user_roles table at creation time
- Return error if cap exceeded
- Remove reliance on client-calculated tierCap as the only enforcement mechanism

**Dependencies:**
- F102 join-time check (ship together)
- Existing user_roles table and useRoles hook already in place

**Notes:**
Current code in app/host-events/create.tsx lines 325-329 calculates tierCap client-side. This is the only enforcement — no server validation exists. Risk: paying customers could see others bypass caps, undermining pricing integrity.

---

### F102 — Join-Time Attendee Cap Check
**Area:** Infrastructure
**Priority:** High
**Release Target:** v1.1.4
**Complexity:** Low
**Risk:** Low
**Status:** 💡 Idea

**Description:**
Add attendee count validation to the join_event RPC. Currently lib/eventAttendees.ts tracks attendee count but does not compare against max_attendees before allowing a join. An event can exceed its cap with no server-side rejection.

**Scope / Requirements:**
- In join_event RPC: query current attendee count for the event
- Compare against events.max_attendees
- Reject with clear error if count >= max_attendees
- Return error message to client: "This event is full."

**Dependencies:**
- F101 server-side attendee cap enforcement
- join_event RPC already exists

---

## Section Indexes

### Events
- F003 — Surface query errors on Event page ✅ Done
- F025 — Upcoming Public Events Near You (v1.2.0)
- F075 — Create Event Form ✅ Done
- F076 — My Events Landing Screen ✅ Done
- F082 — QR Code Event Sharing ✅ Done
- F083 — Event Location / Venue ✅ Done

### Profile
- F007 — Add user_id filters to profile queries (v1.1.0)
- F026 — Phone Number Sign-In ✅ Done
- F049 — Account Settings — Add / Change Phone Number ✅ Done
- F087 — Google Sign-In 🔨 In Progress (v1.1.0)
- F093 — Phone-First Signup Flow Redesign ✅ Done (v1.1.0)
- F094 — Sign in with Apple ✅ Done

### Analytics
- F002 — Fix Host Analytics Event Snapshot metrics ✅ Done
- F013 — Align RPC limit with UI display (Backlog)
- F030 — Event Host Analytics Revamp (v1.1.1)
- F051 — Paywall Analytics Instrumentation ✅ Done
- F071 — Export Analytics Report (v1.1.0)

### Insights
- F019 — Insights Revamp ✅ Done
- F020 — Push Notification System ✅ Done
- F033 — Palate Clarity Unique Whiskey Calculation (v1.1.0)
- F034 — Whiskey Evolution Insights (v1.1.0)
- F038 — Claude "What Should I Drink?" Recommendation (v1.1.0)
- F040 — Pour Profile Tab ✅ Done
- F041 — Insights Summary Tab Restructure ✅ Done
- F042 — Hero Card with Here's Why Bullets ✅ Done
- F045 — Whiskey Type Correlation Insights (v1.1.0)
- F090 — Insights Teaser on Home + Milestone Cards (v1.1.0)
- F091 — Recommendations Foundation (v1.1.0)
- F096 — Weekly Palate Clarity Update System (v1.1.2) 🔍 Scoped

### Tasting
- F001 — All Tastings Page Revamp ✅ Done
- F009 — Fix null guard on avg_rating ✅ Done
- F017 — Enforce minimum rating floor (Backlog)
- F031 — Delete Tasting from Edit Flow ✅ Done
- F032 — Log Again from Previous Tasting ✅ Done
- F037 — Bottle Collection Tracker (v1.1.0)
- F048 — Custom Whiskey Submission Flow Redesign (v1.1.3) 🔨 In Progress
- F050 — Whiskey Card Revamp (v1.1.0)
- F054 — User Submit Edits for Whiskey Records (v1.1.3) ✅ Done
- F097 — Whiskey Card Revamp + Related Whiskey Features (v1.1.2) 🔍 Scoped
- F098 — Pending Whiskey Verification System (v1.1.3) ✅ Done

### Venue
- F005 — Fix hardcoded venue data fallbacks ✅ Done
- F027 — Venue Check-In Foundation (v1.1.3) 🔨 In Progress
- F028 — Venue Host Analytics Dashboard (v1.1.2)
- F029 — B2B Venue Owner Access & Monetization (v1.1.2)
- F044 — Bar / Venue Menu Feature (v1.1.3) ✅ Done
- F046 — Palate Match for Venue Menus (v1.1.2)
- F099 — Venue Menu Management (v1.2.0)

### Discover
- F023 — Bars Nearby with Your Whiskey (v1.2.0)
- F024 — Top Whiskey Bars in Your Area (v1.2.0)

### UX
- F016 — Fix "Save failed" title for validation errors (Backlog)
- F018 — Shareable Flavor Profile Card (v1.1.0)
- F022 — Nearby Whiskey Alerts (v1.2.0)
- F039 — App Store / Play Store Review Prompt ✅ Done
- F057 — Search Relevance Ranking (v1.0.9)
- F064 — Log Screen Full-Screen Search Modal ✅ Done
- F065 — Log Screen Submission-Time Duplicate Detection ✅ Done
- F069 — Whiskey Profile Page Rework (v1.1.0)
- F074 — Header Title Audit (v1.0.9)
- F077 — Host an Event Profile CTA ✅ Done
- F084 — Home Screen Redesign (v1.1.0)
- F085 — Guided New User Onboarding (v1.1.0)
- F086 — What's New Modal (v1.1.0)
- F092 — Community Pulse Modules (v1.1.0)

### Admin
- F059 — Admin Dashboard Redesign ✅ Done
- F060 — Admin Dashboard New KPIs & Monetization Tab ✅ Done
- F061 — Admin Reject RPC Orphaned Tasting Fix ✅ Done
- F066 — Candidate Review Duplicate Detection Panel (v1.1.0)
- F067 — Candidate Review Merge Target on Reject (v1.1.0)
- F068 — Candidate Review Pre-Promotion Metadata Validation (v1.1.0)
- F078 — Role Management Admin Screen ✅ Done
- F079 — Venue Request Admin Screen ✅ Done
- F089 — Duplicate Auth Detection View (v1.1.0)

### Infrastructure
- F004 — Verify personal_notes in public mirror ✅ Done
- F006 — Investigate Exposed Auth Users views ✅ Done
- F008 — Add ownership checks to update/delete (v1.1.0)
- F010 — Replace .single() with .maybeSingle() ✅ Done
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
- F062 — Fuzzy Duplicate Detection RPC ✅ Done
- F063 — search_whiskeys RPC ✅ Done
- F070 — Catalog Duplicate Audit Bulk Brands (v1.1.0)
- F088 — Phone Auth Analytics Events (v1.1.0)
- F095 — Notification Tap Navigation (v1.1.2) 🔍 Scoped
- F100 — Event Monthly Cap Enforcement (v1.1.4)
- F101 — Server-Side Attendee Cap Enforcement (v1.1.4)
- F102 — Join-Time Attendee Cap Check (v1.1.4)

### Growth
- F107 — Premium Nudge Email (v1.1.1)
- F108 — First Tasting Milestone Email (v1.1.1)
- F109 — Monthly Free User Digest (v1.1.1)
- F110 — Weekly Premium Digest (v1.1.1)
- F111 — Lapsed User Email — First Touch (v1.1.1)
- F112 — Lapsed User Email — Second Touch (v1.1.2)
- F113 — Neat Notes Wrapped 2026 (v1.2.0)

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
| v1.0.7 | May 1, 2026 | Events system | ✅ Done | Event system: check-in flow, event page refactor, host view, Supabase sync |
| v1.0.8 | May 10, 2026 | Auth revamp, UX polish, barcode, analytics | ✅ Done | All Tastings revamp, auth revamp (confirm password, two-step verification, phone sign-in), account settings phone management, app store review prompt, paywall analytics funnel, single-tap actions on recent tastings, category mix → whiskey_type, bulletproof barcode flow, duplicate email fix, change phone fix, Log Again inline, insights analytics premium gate, nav bar fix (unstable_settings + font gate), whiskey catalog import groundwork |
| v1.0.9 | TBD | Final UI push — catalog, discovery & web foundation | 💡 Planning | **Shipped:** admin dashboard redesign (F059), new admin KPIs + Monetization tab (F060), admin reject RPC fix (F061), find_duplicate_whiskey_candidates RPC (F062), search_whiskeys RPC (F063), full-screen search modal (F064), submission-time duplicate detection (F065). **In queue (priority order):** whiskey card revamp (F050), Go-UPC fallback + bottle images (F053, alongside F050), user submit edits for whiskey records (F054), web platform consolidation neatnotes-web → neatnotesapp.com (F058), fuzzy/trigram search app-side wiring (F055, confirm F063 coverage first), search relevance ranking app-side wiring (F057, confirm F063 coverage first) |
| v1.1.0 | TBD | "Your palate comes into focus" — shift from journal to palate intelligence platform | 💡 Planning | Whiskey card revamp, Hero Card, Go-UPC fallback + bottle images, shareable flavor profile card, push notifications, custom whiskey submission redesign, whiskey type correlation insights, candidate review duplicate detection panel (F066), candidate review merge target on reject (F067), candidate review pre-promotion validation (F068), whiskey profile page rework (F069), catalog duplicate audit bulk brands (F070), Export Analytics (F071), Home redesign (F084), guided onboarding (F085), What's New modal (F086), Google Sign-In (F087 — code complete, pending build), phone auth analytics (F088), duplicate auth view (F089), Insights teaser + milestone cards on Home (F090), recommendations foundation (F091), Community Pulse modules (F092), phone-first signup flow (F093 ✅ Done) |
| v1.1.1 | TBD | Venue Foundation & Analytics Revamp | 💡 Planning | Venue check-in infrastructure, tastings mapped to venues, event host analytics revamp, Bar/Venue Menu feature |
| v1.1.2 | TBD | B2B Monetization | 💡 Planning | F094 Sign in with Apple ✅ Done. Venue owner analytics dashboard, B2B access & subscription model, Palate Match for venue menus |
| v1.1.3 | TBD | Venue & Whiskey Catalog Quality | 💡 Planning | Venue menu population (F044 ✅), check-in foundation (F027), pending whiskey verification (F098 ✅), user submit edits / Improve this entry (F054 ✅), custom whiskey flow redirect (F048 🔨) |
| v1.1.4 | TBD | Pricing Gate Enforcement | 💡 Planning | Server-side event monthly caps (F100), server-side attendee cap enforcement (F101), join-time attendee cap check (F102). Aligns code gates with commercial pricing model: Starter 2 events/mo 25 attendees, Pro 5 events/mo 50 attendees. |
| v1.2.0 | TBD | Location Platform | 💡 Planning | Location foundation, nearby whiskey alerts, bar discovery fed by venue data, event discovery by location |
| Website | TBD | Web Presence | 💡 Planning | Core marketing site + public events finder (events finder depends on v1.2.0 location platform) |
| Backlog | — | Unscheduled ideas | — | |

---

## Change Log

| Date | Update |
|---|---|
| June 10, 2026 | F016, F029, F030, F035, F050, F055, F057, F069, F071, F072, F073, F097, F099, F100, F101, F102 marked Done. |
| June 10, 2026 | F103-F114 added — email program, deep link redirect, funnel trendlines. F027, F058, F066, F067, F068, F086, F087, F095 marked Done. F033, F034, F038, F045, F088, F089 slid to v1.1.2/Backlog to slim v1.1.0. |
| June 2, 2026 | F100, F101, F102 added — v1.1.4 milestone created for pricing gate enforcement. Server-side monthly event caps (Starter 2/mo, Pro 5/mo, calendar month reset), server-side attendee cap validation, and join-time attendee check. Aligns enforcement with commercial pricing model. |
| May 28, 2026 | F048 marked ✅ Done — Suggest Edits mode shipped on whiskey detail page. Inline editing for all 8 bottle detail fields, edit suggestions table with admin approve/reject flow, camera access for photo upload. MetadataModal removed as dead code. |
| May 28, 2026 | F098 added and shipped — Pending Whiskey Verification System. Custom whiskeys now insert directly into whiskeys table as pending, redirect to whiskey detail page, show Pending Verification badge. Admin Pending Whiskeys inbox tab added. F044 marked ✅ Done — Hartman's Barrel Room menu fully imported, venue profile complete with live check-in count, share deeplink, dynamic last updated. F054 marked ✅ Done — Improve This Entry section shipped on whiskey detail page. F048 moved to 🔨 In Progress. F027 moved to 🔨 In Progress. F099 added — Venue Menu Management. v1.1.3 milestone added. |
| May 26, 2026 | F095, F096, F097 added — notification tap navigation, weekly palate clarity update system, and whiskey card revamp scoped as next action items for v1.1.2. |
| May 26, 2026 | F094 shipped — Sign in with Apple via expo-apple-authentication. Apple Developer capability enabled, Supabase Apple provider configured, signInWithIdToken flow, name capture on first sign-in. F020 shipped — Push notification system complete. user_push_tokens and notification_preferences tables, send-scheduled-notifications and send-behavioral-notifications Edge Functions deployed, pg_cron jobs live (Friday 5pm ET + daily 10am UTC), contextual permission ask after 3rd tasting, notification settings screen in Account Settings. F010 shipped — .maybeSingle() fix eliminates PGRST116 errors for new users. Security: user_metrics_90d_v4 switched to security_invoker — RLS now enforced. Permissions: Android media permissions scoped, expo-image-picker unused plugin removed, locationAlwaysPermission removed. |
| May 19, 2026 | F084, F085, F090, F091 shipped — Home Screen Redesign, guided onboarding, Insights teaser CTA, and Recommendations Foundation complete. |
| May 18, 2026 | F093 added and shipped — Phone-First Signup Flow Redesign. Phone-first OTP path creates account with phone as primary identity via signInWithOtp (shouldCreateUser: true). Email + password linked after OTP verification via linkIdentity + updateUser. Email-only fallback retained. |
| May 18, 2026 | F087 — Google Sign-In implementation committed. Supabase OAuth via expo-auth-session, PKCE + implicit flow handling, GoogleSignInButton + OrDivider components added to sign-in.tsx. iOS client ID wired in app.config.js. Pending production build. |
| May 18, 2026 | F058 updated to 🔨 In Progress — May 18 codebase audit confirms all app code points to neatnotesapp.com. Auth/callback and password reset migration still pending. |
| May 18, 2026 | F026 updated — description revised to reference phone-first signup redesign (F093) shipped today. |
| May 18, 2026 | Phone auth ghost account bug fixed — sendSignUpOtp now calls updateUser({ phone }) instead of signInWithOtp, preventing creation of a second auth user. Session guard added: signInWithPassword called if no active session before updateUser. |
| May 18, 2026 | Sign-in bug fixes shipped: verifyOtp type now dynamic (sms vs phone_change based on context), profiles.update wrapped in non-fatal try/catch in verifyOtp signup branch and verifyPhoneLinkOtp, remove-phone flow guarded with try/catch/finally so setBusy(false) always fires. |
| May 17, 2026 | F084–F092 added — v1.1.0 epics scoped: Home redesign, guided onboarding, What's New modal, Google Sign-In, phone auth analytics, duplicate auth detection, Insights teaser + milestone cards, recommendations foundation, Community Pulse |
| May 15, 2026 | F082, F083 added and shipped — QR event sharing with deep link join flow, event location with venue search. New tables: event_attendees. New RPCs: join_event. New components: EventQRModal. New libs: eventAttendees.ts, venueSearch.ts. |
| May 15, 2026 | F079 added and shipped — Venue Request Admin Screen. Admin can review, approve with role assignment, and reject venue applications. Two RPCs written manually in Supabase. |
| May 14, 2026 | F074-F078 added. Role management infrastructure complete (user_roles, app_role enum, RPCs, useRoles hook). Host an Event flow shipped: Profile CTA, My Events screen, Create Event two-step form. Admin index redesigned. Native build triggered with datetimepicker, expo-notifications, expo-location, expo-media-library installed. |
| May 14, 2026 | v1.0.9 build order prioritized: F050 → F053 → F054 → F058 → F055 → F057. Theme updated to reflect final UI push framing. |
| May 14, 2026 | v1.0.7 and v1.0.8 confirmed live in App Store. Both fully tested and shipped. Active development moves to v1.0.9. |
| May 14, 2026 | F071 added — Export Analytics Report (v1.1.0). Canonical template is colonial-event-report.html/.pdf. |
| May 13, 2026 | F059–F065 shipped: admin dashboard redesign, new KPIs + Monetization tab, admin reject RPC fixed, find_duplicate_whiskey_candidates RPC, search_whiskeys RPC, full-screen search modal, submission-time duplicate detection. F066–F070 added to backlog: candidate review improvements, whiskey profile rework, bulk brand duplicate audit. Catalog cleanup: 41 duplicate pairs removed (bulk import doubling), 11 Lagavulin duplicates cleaned, ~55 records total removed. |
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
