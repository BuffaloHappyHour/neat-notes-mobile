import os
import sys
import json
import requests

SUPABASE_URL = "https://vfqbioksbylatydjqdhg.supabase.co"
OTHER_TYPE_ID = "3cde1227-e497-4a47-ba53-cb21d5d7b506"

service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not service_key:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set.")
    sys.exit(1)

GET_HEADERS = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
}
PATCH_HEADERS = {
    **GET_HEADERS,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}
POST_HEADERS = {
    **GET_HEADERS,
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


# 1. Fetch matched staging records
print("Fetching matched staging records...")
staging = fetch_all(
    "whiskey_import_staging",
    "select=id,pos_name,proof,whiskey_type_id,all_upcs,matched_whiskey_id&status=eq.matched",
)
print(f"  {len(staging)} matched records\n")

if not staging:
    print("Nothing to process.")
    sys.exit(0)

# 2. Fetch existing whiskeys for all matched IDs
whiskey_ids = list({r["matched_whiskey_id"] for r in staging if r.get("matched_whiskey_id")})
print(f"Fetching {len(whiskey_ids)} existing whiskeys...")
ids_str = ",".join(whiskey_ids)
whiskeys_raw = fetch_all(
    "whiskeys",
    f"select=id,proof,whiskey_type_id&id=in.({ids_str})",
)
whiskey_map = {w["id"]: w for w in whiskeys_raw}
print(f"  {len(whiskey_map)} whiskeys fetched\n")

# 3. Fetch existing barcodes to detect duplicates
print("Fetching existing barcodes...")
existing_barcodes_raw = fetch_all("whiskey_barcodes", "select=barcode")
existing_barcodes = {r["barcode"] for r in existing_barcodes_raw}
print(f"  {len(existing_barcodes)} existing barcodes\n")

# 4. Process each matched record
proof_updates = 0
type_updates = 0
barcodes_added = 0
barcodes_skipped = 0
processed = 0

print("Processing matched records...")
for rec in staging:
    whiskey_id = rec.get("matched_whiskey_id")
    if not whiskey_id:
        continue

    existing = whiskey_map.get(whiskey_id)
    if not existing:
        print(f"  WARN: whiskey {whiskey_id} not found for staging {rec['id']}")
        continue

    processed += 1
    patch_payload = {}

    # Proof enrichment
    staging_proof = rec.get("proof")
    if existing.get("proof") is None and staging_proof is not None:
        patch_payload["proof"] = staging_proof

    # Type enrichment
    staging_type = rec.get("whiskey_type_id")
    if (
        existing.get("whiskey_type_id") == OTHER_TYPE_ID
        and staging_type
        and staging_type != OTHER_TYPE_ID
    ):
        patch_payload["whiskey_type_id"] = staging_type

    if patch_payload:
        resp = requests.patch(
            f"{SUPABASE_URL}/rest/v1/whiskeys?id=eq.{whiskey_id}",
            headers=PATCH_HEADERS,
            data=json.dumps(patch_payload),
        )
        if resp.status_code not in (200, 204):
            print(f"  ERROR patching whiskey {whiskey_id}: {resp.status_code} {resp.text[:200]}")
        else:
            if "proof" in patch_payload:
                proof_updates += 1
            if "whiskey_type_id" in patch_payload:
                type_updates += 1

    # UPC / barcode insertion
    all_upcs_str = rec.get("all_upcs") or ""
    upcs = [u.strip() for u in all_upcs_str.split("|") if u.strip()]
    new_barcodes = [u for u in upcs if u not in existing_barcodes]
    skip_count = len(upcs) - len(new_barcodes)
    barcodes_skipped += skip_count

    if new_barcodes:
        barcode_rows = [
            {
                "barcode": upc,
                "whiskey_id": whiskey_id,
                "source": "upc_database",
                "confidence": 0.95,
                "verified": False,
            }
            for upc in new_barcodes
        ]
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/whiskey_barcodes",
            headers=POST_HEADERS,
            data=json.dumps(barcode_rows),
        )
        if resp.status_code not in (200, 201):
            print(f"  ERROR inserting barcodes for whiskey {whiskey_id}: {resp.status_code} {resp.text[:200]}")
        else:
            barcodes_added += len(new_barcodes)
            existing_barcodes.update(new_barcodes)

    if processed % 10 == 0:
        print(f"  {processed}/{len(staging)}...")

print(f"\n{'='*50}")
print(f"SUMMARY")
print(f"{'='*50}")
print(f"Records processed : {processed}")
print(f"Proof updates     : {proof_updates}")
print(f"Type updates      : {type_updates}")
print(f"Barcodes added    : {barcodes_added}")
print(f"Barcodes skipped  : {barcodes_skipped} (already existed)")
