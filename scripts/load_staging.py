import os
import sys
import json
import math
import pandas as pd
import requests

SUPABASE_URL = "https://vfqbioksbylatydjqdhg.supabase.co"
CSV_PATH = r"C:\Users\accur\WhiskeyAppBeta\scripts\output\whiskeys_staging.csv"
TABLE = "whiskey_import_staging"
BATCH_SIZE = 500

service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not service_key:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set.")
    print("Set it with:")
    print('  $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"')
    sys.exit(1)

ENDPOINT = f"{SUPABASE_URL}/rest/v1/{TABLE}"
HEADERS = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

df = pd.read_csv(CSV_PATH)
raw_rows = df.to_dict(orient="records")

def clean(v):
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v

rows = [{k: clean(v) for k, v in row.items()} for row in raw_rows]
total = len(rows)
print(f"Loaded {total} rows from {CSV_PATH}")
print(f"Inserting into {TABLE} in batches of {BATCH_SIZE}...\n")

inserted = 0
for i in range(0, total, BATCH_SIZE):
    batch = rows[i : i + BATCH_SIZE]
    resp = requests.post(ENDPOINT, headers=HEADERS, data=json.dumps(batch))
    if resp.status_code not in (200, 201):
        print(f"ERROR on batch {i//BATCH_SIZE + 1}: {resp.status_code} {resp.text[:300]}")
        sys.exit(1)
    inserted += len(batch)
    print(f"  Inserted {inserted}/{total} rows...")

print(f"\nDone. {inserted} rows inserted into {TABLE}.")
