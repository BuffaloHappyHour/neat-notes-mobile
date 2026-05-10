import os
import sys
import json
import requests

try:
    from thefuzz import fuzz, process
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "thefuzz", "python-Levenshtein"])
    from thefuzz import fuzz, process

SUPABASE_URL = "https://vfqbioksbylatydjqdhg.supabase.co"

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

WHISKEY_IDS = [
    "2e7a670a-1945-4555-9a96-9429a8699f5c",
    "1c750420-13f6-49cb-95be-99c483e69909",
    "01477807-5267-4a13-be07-42bf4e933f97",
    "2963c6e7-e940-4d21-bbcd-12d2a824dccb",
    "6d8a1e80-6443-4c60-974f-137322dce537",
    "863099d0-7810-4114-a8aa-38fc5b75d425",
    "cd0a6ac2-e0ed-4a3b-ad44-446f92286cf3",
    "df463d36-51bd-433a-9c5e-04e25989a1bd",
    "a921be60-a3d5-4af8-bd3b-715c5b9103db",
    "56ec1b67-d4c7-4722-b655-d1891ffb5e40",
    "1f7095fe-0e4a-4ad4-8708-d60c5a67c14c",
    "babd7d7c-6f7e-43f5-b500-5dffb050f470",
    "c432fb10-7629-4347-a69e-5dd01e67903b",
    "6d452654-e7e0-4679-bfff-b88abf5eaa68",
    "1e59ac58-0c9a-4e13-9657-0cc9ca034046",
    "91ce1288-681b-43a9-83a3-c5ceb806eca8",
    "6f6abda7-ff5f-4300-aea1-76a31879c5c1",
    "5bce9ce6-447f-42ad-b84f-af9ff50bd3ac",
    "741a19d2-afac-40cb-b81d-3f8a48a8a2af",
    "2d61430b-6201-4b7e-ba89-0489be867165",
    "39d4483c-7026-4d98-b213-6de01c72d8f3",
    "d7fa18c2-53a2-439d-bcd4-6e2daeb20d89",
    "2157666f-95d1-4170-91db-4a7aa29160af",
    "ca559f9a-f462-4015-bda8-6030f76291d1",
    "47a6a836-a46d-4883-b7ba-fa9b9d52ce1c",
    "3693ea61-e44a-46fc-b777-b9001ea0004c",
    "34690d4a-ee9f-412c-a364-fc50e8a5cfdb",
    "40662bc4-9826-415e-8d8e-700af30326cc",
    "cdc74f64-d25a-41e9-aade-557eb3c512bc",
    "69ee91ce-10dc-4151-a011-1abd374e2439",
    "25e4c3b0-7401-4e63-9115-100b9ecf734f",
    "ae95ebfb-5392-4d01-82e3-3b40132c1b41",
    "fa9bc4e0-bcc8-4c12-827d-d074cffb58cf",
    "8349b214-90ce-4f3b-8a16-894370d2fada",
    "59133e58-30a3-43e5-83b4-72e217b64c1d",
    "8df5ebf1-08d3-4801-9fa0-5aa8f5e5caee",
    "f0fac17d-ddd0-41b3-ba44-91e594cdb3de",
    "51970d43-28e2-4653-b230-81a352e5a898",
    "b971b402-97f0-43ab-a0ae-205a0805cea4",
    "5f48e705-8167-45bd-8dee-cd0eb7b74747",
    "c0922b7d-b8ca-45e8-b958-cc539e9141f9",
    "59a66cb2-ae86-4aff-b094-c42846384c36",
    "1be2de36-f593-4f95-ac65-b716a280ceec",
    "55829780-a92b-4bec-8519-9088081c11e3",
    "3cc5f7ce-f89f-4f9a-9748-3b3bfcd256e0",
    "d01068cf-53c1-423c-8d79-b65b2aaebccc",
    "ed708825-48d6-4715-823e-494cb438d3fd",
    "7d82fe06-116f-4faa-9f10-c67bf6c9e286",
    "a119998e-a08a-42a1-bc97-d4052812220d",
    "85ed3b89-2ab2-4f1c-aa85-553a129dc74c",
    "015f129a-243a-430a-add5-1c56dd16952d",
    "f8f1ef78-b717-49cb-b540-b3e6f47d46ed",
    "48100952-afb1-4f71-b609-219145061518",
    "fc95b7db-8407-4803-a1cb-f213d345ab5c",
    "597042be-ccea-40e7-a9ba-556088873c8b",
    "1e8e07de-581d-4f4f-a77c-3f8ddd9fb3ab",
    "ab99a45b-da41-45ca-9fff-99fe4901a606",
    "3b44d9a9-dbfc-448f-8d78-9dfa4ad87095",
    "329137af-83cf-483f-8b87-4464f509667b",
    "f271f999-f7ad-4ad8-aefa-0beb6f4b1fff",
    "6dfdbe44-2583-4c04-a563-da0c2f6ac165",
    "eeb1087f-37f6-47dd-9147-93088c0fd962",
    "53484c50-bead-4e90-a4f7-502b4b1ea1d8",
    "863915d7-e5cd-4988-af56-c5c4f1efdd84",
    "98c359f3-1e9b-4415-b88c-176d8f32184b",
    "c7c2d234-3ae1-4e38-8472-3e5ab43ab2c5",
    "94f34337-84ca-4555-a33d-7e48707d7fdd",
    "c631fd67-5ea1-4434-a801-62e188f6da63",
    "2081b616-44c0-48b2-ae60-1ed08f8eb21b",
    "89f26acc-3739-4add-b8c2-0025beaed877",
    "ef6c3f72-b1b5-4f61-8706-b83eaa19736e",
    "f2f66fd2-dc0a-457d-8304-8d089750eb2e",
    "153463e9-8806-42c8-b70b-2699d7fdb567",
    "71e27466-f28e-4acd-8786-a1d971cd5279",
    "2df2c5b3-40c6-4336-bd1e-4e40b1393d8d",
    "0666ad57-fd52-434a-8ccd-31e4965571c2",
    "8b6c6d80-d4fa-462e-a6f4-d4ffaa868443",
]


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


# 1. Fetch the target whiskeys
print("Fetching target whiskeys...")
ids_str = ",".join(WHISKEY_IDS)
whiskeys_raw = fetch_all(
    "whiskeys",
    f"select=id,display_name,category,whiskey_type_id&id=in.({ids_str})",
)
whiskeys = [w for w in whiskeys_raw if w.get("display_name")]
print(f"  {len(whiskeys)} whiskeys fetched ({len(WHISKEY_IDS) - len(whiskeys)} missing/inactive)\n")

# 2. Fetch staging records with proof
print("Fetching staging records with proof...")
staging = fetch_all(
    "whiskey_import_staging",
    "select=pos_name,proof,category,whiskey_type_id&proof=not.is.null",
)
print(f"  {len(staging)} staging records with proof\n")

# Group staging by (category, whiskey_type_id) for scoped matching
from collections import defaultdict
by_cat = defaultdict(list)
for s in staging:
    key = (s.get("category") or "", s.get("whiskey_type_id") or "")
    by_cat[key].append(s)

# 3. Fuzzy match each whiskey against staging
print("Matching and updating...")
updated = 0
no_match = 0
errors = 0

for w in whiskeys:
    wid        = w["id"]
    name       = w.get("display_name") or ""
    cat        = w.get("category") or ""
    type_id    = w.get("whiskey_type_id") or ""
    candidates = by_cat.get((cat, type_id), [])

    if not candidates:
        print(f"  NO CANDIDATES  {name!r}  (cat={cat}, type={type_id})")
        no_match += 1
        continue

    # First-word brand prefix filter
    name_first = name.split()[0].lower() if name.split() else ""
    scoped = [
        s for s in candidates
        if s.get("pos_name") and s["pos_name"].split()[0].lower() == name_first
    ]
    if not scoped:
        print(f"  NO PREFIX MATCH  {name!r}")
        no_match += 1
        continue

    names = [s["pos_name"] for s in scoped]
    result = process.extractOne(name, names, scorer=fuzz.token_set_ratio)
    if result is None:
        print(f"  NO FUZZY RESULT  {name!r}")
        no_match += 1
        continue

    best_name, score = result[0], result[1]
    if score < 80:
        print(f"  LOW SCORE ({score})  {name.encode('ascii','replace').decode()}  vs  {best_name.encode('ascii','replace').decode()}")
        no_match += 1
        continue

    matched = next(s for s in scoped if s["pos_name"] == best_name)
    proof = matched["proof"]

    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/whiskeys?id=eq.{wid}",
        headers=PATCH_HEADERS,
        data=json.dumps({"proof": proof}),
    )
    if resp.status_code not in (200, 204):
        print(f"  ERROR updating {wid}: {resp.status_code} {resp.text[:150]}")
        errors += 1
        continue

    sname = name.encode('ascii', 'replace').decode()
    sbest = best_name.encode('ascii', 'replace').decode()
    print(f"  [{score:>3}]  {sname!r}  ->  proof={proof}  (matched: {sbest!r})")
    updated += 1

print(f"\n{'='*60}")
print(f"SUMMARY")
print(f"{'='*60}")
print(f"Total processed : {len(whiskeys)}")
print(f"Proof updated   : {updated}")
print(f"No match found  : {no_match}")
print(f"Errors          : {errors}")
