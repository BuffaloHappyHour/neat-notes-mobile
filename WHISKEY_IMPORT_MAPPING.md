# Whiskey Import — Type Mapping
## Source: Whiskey_Database.xlsx (16,668 rows, UPC Data 4 Spirits)
## Last updated: May 8, 2026

---

## Whiskey Types — Complete UUID Reference

| UUID | Name | is_stretch_eligible |
|------|------|-------------------|
| 248a1457-499f-4e13-b26e-86399965f853 | American Single Malt | true |
| 0cac00fc-a7ab-4c0a-894a-c40bdd25fdc7 | American Whiskey | true |
| 1b6ba890-0739-4c7d-a3d4-64aa31726055 | Blended - Other | false |
| f4d002b1-9fed-4e61-95af-9d0e4be2eb50 | Blended Irish | true |
| 07546989-0977-44f4-b9b1-3339b393ee53 | Blended Irish And American | true |
| de5a94e4-b203-486e-bec7-5c092d50b039 | Blended Malt | true |
| 999f58bb-d56f-4f44-9d27-c184ab6b4eb5 | Blended Scotch | true |
| 85050bc9-99b4-469a-84a2-dc3abf7ed1d0 | Bourbon | true |
| e707f850-35eb-4d7c-8acf-1abe78d1a559 | Corn Whiskey | true |
| 12ca2047-c61c-49fb-afcc-291238c6bf9e | Flavored Whiskey | false |
| 2d713de9-05e1-4404-8046-eb14e9fddeae | Oat Whiskey | true |
| 3cde1227-e497-4a47-ba53-cb21d5d7b506 | Other | false |
| d20cf63e-5736-4572-9c23-6f899b216a57 | Rye | true |
| 5a1db11f-dd3a-49ec-8c6e-485ba71f8dd1 | Rye (Canadian) | true |
| 81fecdb4-1b77-4a36-bdfd-c02c3b5066e2 | Single Grain | true |
| 9349cb96-a41d-42f2-b98e-e2d11aa346a8 | Single Malt | true |
| 3bf5e365-7a53-4922-8a16-ad67acfbda69 | Single Pot Still | true |
| bffb54e3-cabc-4e67-8024-78ded8475343 | Tennessee Whiskey | true |
| ae30dffe-975c-44de-a5a3-bd073d1c36bb | Wheated Whiskey | true |

---

## Source Field Mapping

| Source Field | → Our Field | Notes |
|---|---|---|
| POS_Name | display_name | Full brand + product name |
| Brand_Line | distillery (text) | Brand/distillery name |
| ABV | proof | ABV × 2 = proof |
| Country | category (text) | USA→American, Scotland→Scotch etc |
| Name | whiskey_type_id | Via type mapping table below |
| I_Size | (not imported) | Used for dedup/canonical selection only |
| UPC_A | whiskey_barcodes.barcode | All UPCs for all sizes |
| Region | region (text) | Direct map where populated |

---

## Canonical Record Selection (Deduplication)

One record per unique POS_Name. Size preference order:
1. 750ml
2. 700ml
3. 1000ml (1L)
4. 500ml
5. 375ml
6. Whatever exists

All UPCs from all sizes stored in whiskey_barcodes pointing to the canonical whiskey_id.

---

## Exclusions

Records excluded entirely (not imported):
- Assorted Whiskey — Koval 3-pack gift set
- Rum - Rye Whiskey (3 records)
- Cane Spirit (1 record)
- Fruit Spirit (1 record)
- HKB Hong-Kong Baijiu (1 record) — not whiskey
- Monopolowa Whiskey 1782 (1 record) — potato vodka
- Multi-bottle gift sets identified by name (e.g. "3 Pack", "4 Pack", "Twinset", "Collection X Pack")
- Peated Malts of Distinction Sampler
- That Boutique-Y Whisky Company Greatest Hits 10 Pack
- Jameson Gift Mini Set 4 Pack

---

## Type Mapping: Source Name → whiskey_type_id

### BOURBON GROUP
| Source Name | → Our Type | Notes |
|---|---|---|
| Bourbon Whiskey | Bourbon | |
| Blended Bourbon Whiskey | Bourbon | |
| Kentucky Whiskey (Early Times records) | American Whiskey | Stored in used barrels — not legally Bourbon |
| Kentucky Whiskey (Town Branch record) | American Single Malt | Town Branch Kentucky Single Malt |
| Sour Mash Whiskey | American Whiskey | Michter's, Shenk's etc |
| Rye Whiskey - Bourbon Whiskey | American Whiskey | Genuine blended expressions |
| Bourbon Whiskey - Rye Whiskey | Blended - Other | Multi-pack gift sets |
| Bourbon Whiskey - Wheat Whiskey | American Whiskey | Old Elk blend |
| Blended Bourbon Whiskey - Rye Whiskey | American Whiskey | Nashville Barrel Co 50/50 |
| Louisiana Whiskey | American Whiskey | LA1 Last Batch |
| Bourbon Whiskey - Armagnac | Blended - Other | Says whiskey on label |
| Hefeweizen Whiskey | Blended - Other | Says whiskey on label |
| Bourbon Whiskey - Scotch Whiskey | Blended - Other | Hybrid — says whiskey on label |
| Bourbon Whiskey - Japanese Whiskey | Blended - Other | Tiger Thiccc — literally both |

### SCOTCH GROUP
| Source Name | Condition | → Our Type |
|---|---|---|
| Scotch Whiskey | POS_Name contains "Single Malt" | Single Malt |
| Scotch Whiskey | POS_Name contains "Blend" | Blended Scotch |
| Scotch Whiskey | POS_Name contains "Pure Malt" or "Vatted" | Blended Malt |
| Scotch Whiskey | POS_Name contains "Highland Malt", "Malt Scotch", "Islay Malt", "Island Malt", "Speyside Malt", "Lowland Malt", "Campbeltown Malt" | Single Malt |
| Scotch Whiskey | POS_Name or Brand_Line matches known Single Malt distillery | Single Malt |
| Scotch Whiskey | POS_Name contains "Single Grain", "Patent Still", "Grain Scotch", "Grain Whisky" | Single Grain |
| Scotch Whiskey | POS_Name contains "Hennessy", "Cognac", "Brandy", "Armagnac" | EXCLUDE |
| Scotch Whiskey | POS_Name = "Dimple Pinch" records | Blended Scotch |
| Scotch Whiskey | POS_Name contains "Glen Elgin Speyside Single Pot Still" | Single Malt |
| Scotch Whiskey | POS_Name contains "Shimauta Ryukyu" | Other |
| Scotch Whiskey | POS_Name contains "Lindores Aqua Vitae" or "Lindores New Make" | Single Malt |
| Scotch Whiskey | POS_Name contains "Chivas Brothers The Century Of Malts" | Blended Malt |
| Scotch Whiskey | POS_Name contains "The Exclusive Malts Scotch Malt Whisky" | Single Malt |
| Scotch Whiskey | POS_Name contains "Duncan Taylor" and "North British" | Single Grain |
| Scotch Whiskey | POS_Name contains "That Boutique-Y Whisky Company Greatest Hits" | EXCLUDE |
| Scotch Whiskey | POS_Name contains "Isle of Jura Sweet & Smoky Twinset" | Single Malt |
| Scotch Whiskey | Everything else | Blended Scotch |
| Blended Scotch Whiskey | — | Blended Scotch |
| Malt Whiskey | — | Single Malt |
| Scotch Whiskey - Flavored | — | Flavored Whiskey |
| Blended British Whiskey | — | Blended Scotch |
| Celtic Whiskey | — | Single Malt (Kornog, French/Breton) |

### IRISH GROUP
| Source Name | Condition | → Our Type |
|---|---|---|
| Irish Whiskey | POS_Name contains "Single Malt" OR known SM brand | Single Malt |
| Irish Whiskey | POS_Name contains "Single Pot Still" or "Pot Still" OR known Pot Still brand (Redbreast, Green Spot, Yellow Spot, Red Spot, Blue Spot, Midleton, Powers, Dingle) | Single Pot Still |
| Irish Whiskey | POS_Name contains "Single Grain" (overrides Pot Still brand if present in name) | Single Grain |
| Irish Whiskey | POS_Name contains "Blend" | Blended Irish |
| Irish Whiskey | Multi-bottle gift sets | EXCLUDE |
| Irish Whiskey | Everything else | Blended Irish |
| Blended Irish Whiskey | — | Blended Irish |
| Irish Whiskey - American Whiskey | — | Blended - Other |
| Irish Whiskey - Bourbon Whiskey | — | Blended - Other |
| Irish Whiskey - Rye Whiskey | — | Blended - Other |
| Irish Whiskey - Flavored | — | Flavored Whiskey |

### JAPANESE GROUP
| Source Name | Condition | → Our Type |
|---|---|---|
| Japanese Whiskey | POS_Name contains "Single Malt" | Single Malt |
| Japanese Whiskey | Brand_Line matches known SM distillery (Yamazaki, Hakushu, Yoichi, Miyagikyo, Chichibu, Akkeshi) | Single Malt |
| Japanese Whiskey | POS_Name contains "Single Grain" | Single Grain |
| Japanese Whiskey | POS_Name contains "Pure Malt", "Blended Malt", "Vatted Malt" | Blended Malt |
| Japanese Whiskey | POS_Name contains "Blend" (not Blended Malt) | Blended Malt |
| Japanese Whiskey | Everything else | Blended Malt |
| Blended Japanese Whiskey | — | Blended Malt |

### AMERICAN / CANADIAN GROUP
| Source Name | → Our Type | Notes |
|---|---|---|
| Rye Whiskey | Rye | |
| Blended Rye Whiskey | Rye | |
| Triticale Whiskey | Rye | Rye-dominant grain |
| Barley Whiskey — Masterson's | Single Malt | Canadian, 100% barley malt |
| Barley Whiskey — Coppersea | American Whiskey | American, green/unmalted barley |
| American Whiskey | American Whiskey | |
| Blended American Whiskey | American Whiskey | |
| Wheat Whiskey | Wheated Whiskey | |
| Light Whiskey | American Whiskey | TTB legal category |
| Hop Whiskey | American Whiskey | Beer-inspired, still whiskey |
| Oat Whiskey | Oat Whiskey | |
| Blended Grain Whiskey | American Whiskey | |
| Grain Whiskey | American Whiskey | |
| Tennessee Whiskey | Tennessee Whiskey | |
| Corn Whiskey | Corn Whiskey | |
| White Whiskey | Corn Whiskey | |
| Unaged Whiskey | Corn Whiskey | |
| Blended Canadian Whiskey | Rye (Canadian) | Country = Canada |
| Canadian Whiskey | Rye (Canadian) | Country = Canada |
| Canadian Rye Whiskey | Rye (Canadian) | |
| Blended Canadian Rye Whiskey | Rye (Canadian) | |
| Corn Whiskey - Rye Whiskey | Blended - Other | |

### ALL FLAVORED → Flavored Whiskey
American Whiskey - Flavored, Canadian Whiskey - Flavored, Bourbon Whiskey - Flavored,
Blended Canadian Whiskey - Flavored, Rye Whiskey - Flavored, Corn Whiskey - Flavored,
Blended American Whiskey - Flavored, Tennessee Whiskey - Flavored, German Whiskey - Flavored,
Hop Whiskey - Flavored, Canadian Rye Whiskey - Flavored, Blended Irish Whiskey - Flavored,
Wheat Whiskey - Flavored, Malt Whiskey - Flavored

### WORLD WHISKIES (Indian, Australian, Taiwanese, French, Swedish, Israeli, English, etc.)
| Condition | → Our Type |
|---|---|
| POS_Name contains "Single Malt" | Single Malt |
| POS_Name contains "Single Grain" | Single Grain |
| POS_Name contains "Pure Malt", "Blended Malt", "Vatted Malt" | Blended Malt |
| POS_Name contains "Blend" | Blended Malt |
| HKB Hong-Kong Baijiu | EXCLUDE — not whiskey |
| Monopolowa Whiskey 1782 | EXCLUDE — potato vodka |
| Everything else | Single Malt (default — mostly craft malt distilleries) |
| Blended French Whiskey | Blended Malt |

---

## Import Pipeline (Next Session)

Phase 1: Build classification Python script
Phase 2: Create whiskey_import_staging table in Supabase
Phase 3: Run script → load staging
Phase 4: Audit staging results
Phase 5: Fuzzy match against existing 1,160 whiskeys records
Phase 6: Manual review of likely duplicates
Phase 7: Promote clean records to whiskeys table
Phase 8: Populate whiskey_barcodes with all UPCs

---

## Stats
- Source rows: 16,668
- Unique products (by POS_Name): ~11,785
- Products with 750ml or 700ml: 10,861
- Products only in non-standard sizes: 924 (all included)
- UPC coverage: 99.5%
- ABV coverage: 100%
- Estimated final import count: ~11,700 (after exclusions)

---

## Country → Category / Region Mapping

### Source Country field → whiskeys.category + whiskeys.region

| Source Country | → category | → region | Notes |
|---|---|---|---|
| USA | American | Other | No state data in source — use Other |
| Scotland | Scotch | Scotland | |
| Scotland (trailing space) | Scotch | Scotland | Trim whitespace |
| Scotlan (typo) | Scotch | Scotland | Typo fix |
| scotland (lowercase) | Scotch | Scotland | Case fix |
| St. Andrews | Scotch | Scotland | Location in Scotland |
| Canada | Canadian | Canada | |
| Ireland | Irish | Ireland | |
| Japan | Japanese | Japan | |
| India | World | India | |
| Australia | World | Australia | |
| Tasmania | World | Australia | Tasmania is part of Australia |
| France | World | France | |
| Taiwan | World | Taiwan | |
| England | World | England | |
| Wales | World | Wales | |
| United Kingdom | World | England | Default to England for ambiguous UK |
| Sweden | World | Sweden | |
| Israel | World | Israel | |
| Germany | World | Germany | |
| New Zealand | World | New Zealand | |
| South Africa | World | South Africa | |
| Finland | World | Finland | |
| Finalnd (typo) | World | Finland | Typo fix |
| Spain | World | Spain | |
| Belgium | World | Belgium | |
| Austria | World | Austria | |
| Italy | World | Italy | |
| Thailand | World | Thailand | |
| Denmark | World | Denmark | |
| China | World | China | |
| Netherlands | World | Netherlands | |
| Panama | World | Other | No legitimate whiskey industry |
| Dominican Republic | World | Other | |
| El Salvador | World | Other | |
| Peru | World | Other | |
| Lebanon | World | Lebanon | |
| Yugoslavia | World | Other | No longer a country |
| Polish | World | Other | Mislabeled — Poland not in source |
| Mexico | World | Mexico | |
| Sri Lanka | World | Sri Lanka | |

### sub_region
All imported records use sub_region = "Other" — source has no sub-region data.
Region enrichment available via distillery lookup (Layer 1) or F054 user submit edits post-import.

---

## Import Strategy

### Layer 1 — Distillery name match (highest quality)
- Fuzzy match Brand_Line from source against distilleries.name
- Where matched: inherit category, region, sub_region from distillery record AND set distillery_id
- Estimated coverage: 20-30% of records (major brands)

### Layer 2 — Country-based defaults (medium quality)
- For unmatched records: apply country → category/region mapping above
- No distillery_id set
- Estimated coverage: remaining 70-80%

### Layer 3 — New distillery stubs
- For major brands not in distilleries table, create stub records during import
- Grows distillery table organically alongside whiskey catalog

---

## Database Fixes Applied (May 8, 2026)
- whiskey_regions + whiskey_sub_regions: added 19 World regions (England, Wales, Sweden, Israel, Germany, New Zealand, South Africa, Finland, Spain, Belgium, Austria, Italy, Denmark, China, Thailand, Netherlands, Mexico, Sri Lanka, Lebanon)
- distilleries: fixed Brenne (World/France), Cooley (Irish/Ireland), Fingerlakes Distilling (American/New York), Kyro Distillery (World/Finland), Keeper's Heart (American/Minnesota)
- whiskey_types: added Flavored Whiskey, Blended - Other, Single Grain, Wheated Whiskey, Oat Whiskey
