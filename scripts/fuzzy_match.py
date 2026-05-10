import os
import sys
import json
import requests
from collections import defaultdict

try:
    from thefuzz import fuzz, process
except ImportError:
    import subprocess
    print("Installing thefuzz + python-Levenshtein...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "thefuzz", "python-Levenshtein"])
    from thefuzz import fuzz, process

SUPABASE_URL = "https://vfqbioksbylatydjqdhg.supabase.co"

service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not service_key:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set.")
    print('  $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"')
    sys.exit(1)

GET_HEADERS = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
}
PATCH_HEADERS = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def fetch_all(table, params):
    rows = []
    page_size = 1000
    offset = 0
    while True:
        headers = {**GET_HEADERS, "Range": f"{offset}-{offset + page_size - 1}"}
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=headers)
        if resp.status_code not in (200, 206):
            print(f"ERROR fetching {table}: {resp.status_code} {resp.text[:300]}")
            sys.exit(1)
        data = resp.json()
        rows.extend(data)
        if len(data) < page_size:
            break
        offset += page_size
    return rows


def patch_bulk(ids, payload, label):
    """PATCH the same payload onto many rows, batching 100 IDs per URL filter."""
    chunk = 100
    for i in range(0, len(ids), chunk):
        batch = ids[i : i + chunk]
        ids_str = ",".join(batch)
        resp = requests.patch(
            f"{SUPABASE_URL}/rest/v1/whiskey_import_staging?id=in.({ids_str})",
            headers=PATCH_HEADERS,
            data=json.dumps(payload),
        )
        if resp.status_code not in (200, 204):
            print(f"ERROR patch_bulk ({label}): {resp.status_code} {resp.text[:300]}")
            sys.exit(1)
    print(f"  {label}: {len(ids)} records updated")


def patch_per_row(updates, label):
    """PATCH each row individually (different values per row)."""
    for i, upd in enumerate(updates):
        rec_id = upd["id"]
        payload = {k: v for k, v in upd.items() if k != "id"}
        resp = requests.patch(
            f"{SUPABASE_URL}/rest/v1/whiskey_import_staging?id=eq.{rec_id}",
            headers=PATCH_HEADERS,
            data=json.dumps(payload),
        )
        if resp.status_code not in (200, 204):
            print(f"ERROR patch_per_row ({label}) row {rec_id}: {resp.status_code} {resp.text[:200]}")
            sys.exit(1)
        if (i + 1) % 200 == 0:
            print(f"    {i + 1}/{len(updates)}...")
    print(f"  {label}: {len(updates)} records updated")


# 1. Fetch existing whiskeys
print("Fetching existing whiskeys...")
whiskeys = fetch_all(
    "whiskeys",
    "select=id,display_name,category,whiskey_type_id&is_active=eq.true",
)
print(f"  {len(whiskeys)} active whiskeys")

# 2. Fetch pending staging records
print("Fetching staging records...")
staging = fetch_all(
    "whiskey_import_staging",
    "select=id,pos_name,category,whiskey_type_id&status=eq.pending",
)
print(f"  {len(staging)} pending staging records\n")

# Group existing whiskeys by (category, whiskey_type_id)
by_cat = defaultdict(list)
for w in whiskeys:
    key = (w.get("category") or "", w.get("whiskey_type_id") or "")
    by_cat[key].append(w)

# 3. Fuzzy match
auto   = []
review = []
new    = []

print("Fuzzy matching...")
for i, rec in enumerate(staging):
    if i > 0 and i % 1000 == 0:
        print(f"  {i}/{len(staging)}...")

    pos      = rec.get("pos_name") or ""
    cat      = rec.get("category") or ""
    type_id  = rec.get("whiskey_type_id") or ""
    candidates = by_cat.get((cat, type_id), [])

    if not candidates:
        new.append(rec)
        continue

    pos_first = pos.split()[0].lower() if pos.split() else ""
    names = [
        w["display_name"] for w in candidates
        if w.get("display_name")
        and w["display_name"].split()[0].lower() == pos_first
    ]
    if not names:
        new.append(rec)
        continue

    result = process.extractOne(pos, names, scorer=fuzz.token_sort_ratio)
    if result is None:
        new.append(rec)
        continue

    best_name, score = result[0], result[1]
    matched = next(w for w in candidates if w.get("display_name") == best_name)

    if score >= 90:
        auto.append({"rec": rec, "match": matched, "score": score})
    elif score >= 85:
        review.append({"rec": rec, "match": matched, "score": score})
    else:
        new.append(rec)

print(f"  Done — {len(auto)} auto / {len(review)} review / {len(new)} new\n")

# 4. Write results back
print("Writing results to whiskey_import_staging...")

# new: all get the same payload — bulk PATCH
if new:
    patch_bulk(
        [r["id"] for r in new],
        {"status": "new", "matched_whiskey_id": None, "match_score": None, "match_notes": None},
        "new",
    )

# matched / review: different matched_whiskey_id + score per row — per-row PATCH
if auto:
    patch_per_row(
        [
            {
                "id": item["rec"]["id"],
                "status": "matched",
                "matched_whiskey_id": item["match"]["id"],
                "match_score": item["score"],
                "match_notes": None,
            }
            for item in auto
        ],
        "matched",
    )

if review:
    patch_per_row(
        [
            {
                "id": item["rec"]["id"],
                "status": "review",
                "matched_whiskey_id": item["match"]["id"],
                "match_score": item["score"],
                "match_notes": "fuzzy match needs review",
            }
            for item in review
        ],
        "review",
    )

# 5. Manual overrides — force specific pos_names to status=new
MANUAL_NEW = [
    "Loch Lomond Single Malt Scotch Whisky 18 Year",
    "Loch Lomond Single Malt Scotch Whisky 14 Year",
    "Loch Lomond Single Malt Scotch Whisky 21 Year",
    "Loch Lomond Single Malt Scotch Whisky 50 Year",
    "Loch Lomond Single Malt Scotch Whisky 30 Year",
    "Old Carter Straight Rye Whiskey",
    "Blue Note Rye Whiskey",
    "Great Jones Straight Bourbon Whiskey",
    "Booker's Noe Bourbon",
    "Jack Daniel's Bonded Tennessee Whiskey",
    "Jack Daniel's Tennessee Whiskey 5 Pack",
    "Early Times Kentucky Whisky 10 Pack",
    "Maker's Mark No 46 Kentucky Straight Bourbon Whiskey",
    "Smoke Wagon Straight Bourbon Whiskey Halloween",
    "Larceny Kentucky Straight Bourbon Whiskey Barrel Proof",
    "Penderyn Sherrywood Single Malt Welsh Whiskey",
    "Breckenridge Whiskey Port Cask Finish",
    "Blue Note Juke Joint Uncut Bourbon Whiskey",
]

override_payload = json.dumps({
    "status": "new",
    "matched_whiskey_id": None,
    "match_score": None,
    "match_notes": "manual override - different expression",
})

print("Applying manual overrides...")
override_hits = 0
override_miss = []
for name in MANUAL_NEW:
    encoded = requests.utils.quote(name)
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/whiskey_import_staging?pos_name=ilike.{encoded}",
        headers=PATCH_HEADERS,
        data=override_payload,
    )
    if resp.status_code not in (200, 204):
        print(f"  ERROR overriding '{name}': {resp.status_code} {resp.text[:200]}")
        override_miss.append(name)
    else:
        override_hits += 1
print(f"  {override_hits}/{len(MANUAL_NEW)} overrides applied")
if override_miss:
    for m in override_miss:
        print(f"  MISSED: {m}")

# 6. Summary
total = len(staging)
print(f"\n{'='*60}")
print(f"SUMMARY")
print(f"{'='*60}")
print(f"Total processed : {total}")
print(f"Auto-matched    : {len(auto)}   (status=matched)")
print(f"Needs review    : {len(review)}   (status=review)")
print(f"New records     : {len(new)}   (status=new)")

if review:
    print(f"\n--- ALL REVIEW MATCHES ({len(review)}) ---")
    print(f"{'Scr':>3}  {'Staging POS Name':<52}  Existing Display Name")
    print("-" * 115)
    for item in sorted(review, key=lambda x: x["score"], reverse=True):
        pos  = (item["rec"].get("pos_name")       or "")[:50]
        disp = (item["match"].get("display_name") or "")[:50]
        print(f" {item['score']:>3}  {pos:<52}  {disp}")

if auto:
    print(f"\n--- TOP 20 AUTO MATCHES (spot-check) ---")
    print(f"{'Scr':>3}  {'Staging POS Name':<52}  Existing Display Name")
    print("-" * 115)
    for item in sorted(auto, key=lambda x: x["score"], reverse=True)[:20]:
        pos  = (item["rec"].get("pos_name")       or "")[:50]
        disp = (item["match"].get("display_name") or "")[:50]
        print(f" {item['score']:>3}  {pos:<52}  {disp}")
