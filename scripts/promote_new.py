import os
import sys
import json
import requests

SUPABASE_URL = "https://vfqbioksbylatydjqdhg.supabase.co"

service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not service_key:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set.")
    sys.exit(1)

GET_HEADERS = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
}
POST_WHISKEY_HEADERS = {
    **GET_HEADERS,
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=ignore-duplicates",
}
POST_BARCODE_HEADERS = {
    **GET_HEADERS,
    "Content-Type": "application/json",
    "Prefer": "return=minimal,resolution=ignore-duplicates",
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


def make_slug(pos_name):
    return (pos_name or "").lower().replace(" ", "-")[:200]


def insert_barcodes(barcode_rows, batch_size=500):
    inserted = 0
    errors = 0
    for i in range(0, len(barcode_rows), batch_size):
        batch = barcode_rows[i : i + batch_size]
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/whiskey_barcodes?on_conflict=barcode",
            headers=POST_BARCODE_HEADERS,
            data=json.dumps(batch),
        )
        if resp.status_code not in (200, 201):
            print(f"  ERROR inserting barcode batch {i//batch_size + 1}: {resp.status_code} {resp.text[:200]}")
            errors += len(batch)
        else:
            inserted += len(batch)
    return inserted, errors


# 1. Fetch all new staging records
print("Fetching new staging records...")
staging = fetch_all(
    "whiskey_import_staging",
    "select=id,pos_name,brand_line,proof,category,region,sub_region,whiskey_type_id,all_upcs"
    "&status=eq.new",
)
print(f"  {len(staging)} new records\n")

if not staging:
    print("Nothing to promote.")
    sys.exit(0)

# 2. Insert whiskeys in batches of 100, collect barcodes as we go
WHISKEY_BATCH = 100
whiskeys_inserted = 0
whiskeys_errors = 0
pending_barcodes = []

print(f"Inserting whiskeys in batches of {WHISKEY_BATCH}...")
for batch_start in range(0, len(staging), WHISKEY_BATCH):
    batch = staging[batch_start : batch_start + WHISKEY_BATCH]

    whiskey_rows = [
        {
            "display_name": rec["pos_name"],
            "distillery": rec.get("brand_line"),
            "proof": rec.get("proof"),
            "category": rec.get("category"),
            "region": rec.get("region"),
            "sub_region": rec.get("sub_region"),
            "whiskey_type_id": rec.get("whiskey_type_id"),
            "is_active": True,
            "age_is_nas": True,
            "whiskey_canonical": make_slug(rec["pos_name"]),
        }
        for rec in batch
    ]

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/whiskeys?on_conflict=whiskey_canonical",
        headers=POST_WHISKEY_HEADERS,
        data=json.dumps(whiskey_rows),
    )

    if resp.status_code not in (200, 201):
        print(f"  ERROR on batch {batch_start//WHISKEY_BATCH + 1}: {resp.status_code} {resp.text[:300]}")
        whiskeys_errors += len(batch)
        continue

    inserted_whiskeys = resp.json()
    whiskeys_inserted += len(inserted_whiskeys)

    # Map display_name → new id so we can attach barcodes
    id_by_name = {w["display_name"]: w["id"] for w in inserted_whiskeys}

    for rec in batch:
        whiskey_id = id_by_name.get(rec["pos_name"])
        if not whiskey_id:
            continue
        all_upcs_str = rec.get("all_upcs") or ""
        for upc in all_upcs_str.split("|"):
            upc = upc.strip()
            if upc:
                pending_barcodes.append({
                    "barcode": upc,
                    "whiskey_id": whiskey_id,
                    "source": "upc_database",
                    "confidence": 0.9,
                    "verified": False,
                })

    if whiskeys_inserted % 500 == 0 or whiskeys_inserted == len(staging):
        print(f"  {whiskeys_inserted}/{len(staging)} whiskeys inserted...")

print(f"  Done — {whiskeys_inserted} inserted, {whiskeys_errors} errors\n")

# 3. Insert barcodes
print(f"Inserting {len(pending_barcodes)} barcodes...")
barcodes_inserted, barcodes_errors = insert_barcodes(pending_barcodes)
print(f"  Done — {barcodes_inserted} inserted, {barcodes_errors} errors\n")

print(f"{'='*50}")
print(f"SUMMARY")
print(f"{'='*50}")
print(f"Whiskeys inserted : {whiskeys_inserted}")
print(f"Whiskey errors    : {whiskeys_errors}")
print(f"Barcodes inserted : {barcodes_inserted}")
print(f"Barcode errors    : {barcodes_errors}")
