import os
import re
import pandas as pd

FILE = r"C:\Users\accur\Downloads\working-whiskey.xlsx"
SHEET = "Liquor"
OUTPUT_DIR = r"C:\Users\accur\WhiskeyAppBeta\scripts\output"

# --- WHISKEY TYPE UUIDs ---
BOURBON              = '85050bc9-99b4-469a-84a2-dc3abf7ed1d0'
RYE                  = 'd20cf63e-5736-4572-9c23-6f899b216a57'
RYE_CANADIAN         = '5a1db11f-dd3a-49ec-8c6e-485ba71f8dd1'
TENNESSEE            = 'bffb54e3-cabc-4e67-8024-78ded8475343'
AMERICAN_WHISKEY     = '0cac00fc-a7ab-4c0a-894a-c40bdd25fdc7'
AMERICAN_SINGLE_MALT = '248a1457-499f-4e13-b26e-86399965f853'
WHEATED              = 'ae30dffe-975c-44de-a5a3-bd073d1c36bb'
CORN                 = 'e707f850-35eb-4d7c-8acf-1abe78d1a559'
OAT                  = '2d713de9-05e1-4404-8046-eb14e9fddeae'
SINGLE_MALT          = '9349cb96-a41d-42f2-b98e-e2d11aa346a8'
BLENDED_SCOTCH       = '999f58bb-d56f-4f44-9d27-c184ab6b4eb5'
BLENDED_MALT         = 'de5a94e4-b203-486e-bec7-5c092d50b039'
SINGLE_GRAIN         = '81fecdb4-1b77-4a36-bdfd-c02c3b5066e2'
BLENDED_IRISH        = 'f4d002b1-9fed-4e61-95af-9d0e4be2eb50'
BLENDED_IRISH_AMERICAN = '07546989-0977-44f4-b9b1-3339b393ee53'
SINGLE_POT_STILL     = '3bf5e365-7a53-4922-8a16-ad67acfbda69'
FLAVORED             = '12ca2047-c61c-49fb-afcc-291238c6bf9e'
BLENDED_OTHER        = '1b6ba890-0739-4c7d-a3d4-64aa31726055'
OTHER                = '3cde1227-e497-4a47-ba53-cb21d5d7b506'

UUID_NAMES = {
    BOURBON: 'Bourbon',
    RYE: 'Rye',
    RYE_CANADIAN: 'Canadian Rye',
    TENNESSEE: 'Tennessee',
    AMERICAN_WHISKEY: 'American Whiskey',
    AMERICAN_SINGLE_MALT: 'American Single Malt',
    WHEATED: 'Wheated',
    CORN: 'Corn',
    OAT: 'Oat',
    SINGLE_MALT: 'Single Malt',
    BLENDED_SCOTCH: 'Blended Scotch',
    BLENDED_MALT: 'Blended Malt',
    SINGLE_GRAIN: 'Single Grain',
    BLENDED_IRISH: 'Blended Irish',
    BLENDED_IRISH_AMERICAN: 'Blended Irish/American',
    SINGLE_POT_STILL: 'Single Pot Still',
    FLAVORED: 'Flavored',
    BLENDED_OTHER: 'Blended Other',
    OTHER: 'Other',
}

# --- COUNTRY MAP ---
COUNTRY_MAP = {
    'USA':                ('American',  'Other'),
    'Scotland':           ('Scotch',    'Scotland'),
    'St. Andrews':        ('Scotch',    'Scotland'),
    'Canada':             ('Canadian',  'Canada'),
    'Ireland':            ('Irish',     'Ireland'),
    'Japan':              ('Japanese',  'Japan'),
    'India':              ('World',     'India'),
    'Australia':          ('World',     'Australia'),
    'Tasmania':           ('World',     'Australia'),
    'France':             ('World',     'France'),
    'Taiwan':             ('World',     'Taiwan'),
    'England':            ('World',     'England'),
    'Wales':              ('World',     'Wales'),
    'United Kingdom':     ('World',     'England'),
    'Sweden':             ('World',     'Sweden'),
    'Israel':             ('World',     'Israel'),
    'Germany':            ('World',     'Germany'),
    'New Zealand':        ('World',     'New Zealand'),
    'South Africa':       ('World',     'South Africa'),
    'Finland':            ('World',     'Finland'),
    'Finalnd':            ('World',     'Finland'),
    'Spain':              ('World',     'Spain'),
    'Belgium':            ('World',     'Belgium'),
    'Austria':            ('World',     'Austria'),
    'Italy':              ('World',     'Italy'),
    'Thailand':           ('World',     'Thailand'),
    'Denmark':            ('World',     'Denmark'),
    'China':              ('World',     'China'),
    'Netherlands':        ('World',     'Netherlands'),
    'Panama':             ('World',     'Other'),
    'Dominican Republic': ('World',     'Other'),
    'El Salvador':        ('World',     'Other'),
    'Peru':               ('World',     'Other'),
    'Lebanon':            ('World',     'Lebanon'),
    'Yugoslavia':         ('World',     'Other'),
    'Polish':             ('World',     'Other'),
    'Mexico':             ('World',     'Mexico'),
    'Sri Lanka':          ('World',     'Sri Lanka'),
}

SIZE_PREF = [750, 700, 1000, 500, 375]


def size_rank(size):
    try:
        s = float(size)
        for i, p in enumerate(SIZE_PREF):
            if abs(s - p) < 0.5:
                return i
        return len(SIZE_PREF)
    except (ValueError, TypeError):
        return len(SIZE_PREF) + 1


def collect_upcs(upcs_series):
    result = []
    for u in upcs_series:
        if pd.isna(u):
            continue
        try:
            result.append(str(int(float(u))))
        except (ValueError, TypeError):
            s = str(u).strip()
            if s:
                result.append(s)
    return '|'.join(dict.fromkeys(result))


def map_country(country):
    if pd.isna(country):
        return ('World', 'Other')
    return COUNTRY_MAP.get(str(country).strip(), ('World', 'Other'))


def classify_type(name, pos_name, brand_line, country):
    name       = str(name)       if not pd.isna(name)       else ''
    pos_name   = str(pos_name)   if not pd.isna(pos_name)   else ''
    brand_line = str(brand_line) if not pd.isna(brand_line) else ''

    # FLAVORED
    if name.endswith('- Flavored') or 'Flavored' in name:
        return FLAVORED

    # BLENDED_OTHER
    if name in ['Rum - Rye Whiskey', 'Corn Whiskey - Rye Whiskey',
                'Bourbon Whiskey - Armagnac', 'Hefeweizen Whiskey',
                'Bourbon Whiskey - Scotch Whiskey', 'Bourbon Whiskey - Japanese Whiskey',
                'Bourbon Whiskey - Rye Whiskey']:
        return BLENDED_OTHER

    # BOURBON GROUP
    if name == 'Bourbon Whiskey':            return BOURBON
    if name == 'Blended Bourbon Whiskey':    return BOURBON
    if name == 'Tennessee Whiskey':          return TENNESSEE
    if name == 'Sour Mash Whiskey':          return AMERICAN_WHISKEY
    if name == 'Kentucky Whiskey':
        if 'Town Branch' in brand_line:      return AMERICAN_SINGLE_MALT
        return AMERICAN_WHISKEY
    if name == 'Louisiana Whiskey':          return AMERICAN_WHISKEY
    if name in ['Rye Whiskey - Bourbon Whiskey', 'Bourbon Whiskey - Wheat Whiskey',
                'Blended Bourbon Whiskey - Rye Whiskey']:
        return AMERICAN_WHISKEY

    # AMERICAN
    if name == 'Rye Whiskey':               return RYE
    if name == 'Blended Rye Whiskey':       return RYE
    if name == 'Triticale Whiskey':         return RYE
    if name == 'Barley Whiskey':
        if 'Masterson' in brand_line:       return SINGLE_MALT
        return AMERICAN_WHISKEY
    if name in ['American Whiskey', 'Blended American Whiskey', 'Blended Grain Whiskey',
                'Grain Whiskey', 'Light Whiskey', 'Hop Whiskey']:
        return AMERICAN_WHISKEY
    if name == 'Wheat Whiskey':             return WHEATED
    if name == 'Oat Whiskey':               return OAT
    if name in ['Corn Whiskey', 'White Whiskey', 'Unaged Whiskey']:
        return CORN

    # CANADIAN
    if name in ['Canadian Whiskey', 'Blended Canadian Whiskey',
                'Canadian Rye Whiskey', 'Blended Canadian Rye Whiskey']:
        return RYE_CANADIAN

    # SCOTCH
    if name in ['Scotch Whiskey', 'Malt Whiskey', 'Blended British Whiskey']:
        pos = pos_name.upper()
        if any(x in pos for x in ['SINGLE MALT', 'HIGHLAND MALT', 'ISLAY MALT',
                                   'ISLAND MALT', 'SPEYSIDE MALT', 'LOWLAND MALT',
                                   'CAMPBELTOWN MALT', 'MALT SCOTCH']):
            return SINGLE_MALT
        if any(x in pos for x in ['PURE MALT', 'VATTED', 'BLENDED MALT']):
            return BLENDED_MALT
        if any(x in pos for x in ['SINGLE GRAIN', 'PATENT STILL', 'GRAIN SCOTCH',
                                   'GRAIN WHISKY', 'GRAIN WHISKEY']):
            return SINGLE_GRAIN
        if 'BLEND' in pos:
            return BLENDED_SCOTCH
        if name == 'Malt Whiskey':           return SINGLE_MALT
        if name == 'Blended British Whiskey': return BLENDED_SCOTCH
        return BLENDED_SCOTCH
    if name == 'Blended Scotch Whiskey':    return BLENDED_SCOTCH
    if name == 'Celtic Whiskey':            return SINGLE_MALT

    # IRISH
    if name in ['Irish Whiskey', 'Blended Irish Whiskey']:
        pos = pos_name.upper()
        known_sm  = ['TEELING', 'DINGLE', 'WATERFORD', 'CONNEMARA', 'BUSHMILLS SINGLE']
        known_pot = ['REDBREAST', 'GREEN SPOT', 'YELLOW SPOT', 'RED SPOT', 'BLUE SPOT',
                     'POWERS', 'DINGLE POT', 'MIDLETON']
        if 'SINGLE GRAIN' in pos:                                   return SINGLE_GRAIN
        if 'SINGLE MALT' in pos or any(x in pos for x in known_sm): return SINGLE_MALT
        if ('SINGLE POT STILL' in pos or 'POT STILL' in pos
                or any(x in pos for x in known_pot)):                return SINGLE_POT_STILL
        if 'BLEND' in pos:                                           return BLENDED_IRISH
        return BLENDED_IRISH
    if name in ['Irish Whiskey - American Whiskey', 'Irish Whiskey - Bourbon Whiskey',
                'Irish Whiskey - Rye Whiskey']:
        return BLENDED_OTHER

    # JAPANESE
    if name in ['Japanese Whiskey', 'Blended Japanese Whiskey']:
        pos = pos_name.upper()
        known_sm = ['YAMAZAKI', 'HAKUSHU', 'YOICHI', 'MIYAGIKYO', 'CHICHIBU', 'AKKESHI']
        if 'SINGLE MALT' in pos or any(x in pos for x in known_sm): return SINGLE_MALT
        if 'SINGLE GRAIN' in pos:                                    return SINGLE_GRAIN
        if any(x in pos for x in ['PURE MALT', 'BLENDED MALT', 'VATTED MALT']):
            return BLENDED_MALT
        return BLENDED_MALT

    # WORLD WHISKIES
    world_types = [
        'Indian Whiskey', 'Australian Whiskey', 'Taiwanese Whiskey', 'French Whiskey',
        'Swedish Whiskey', 'Israeli Whiskey', 'English Whiskey', 'New Zealand Whiskey',
        'Welsh Whiskey', 'South African Whiskey', 'Belgian Whiskey', 'Austrian Whiskey',
        'Spanish Whiskey', 'Italian Whiskey', 'Finland Whiskey', 'German Whiskey',
        'Danish Whiskey', 'Dominican Republic Whiskey', 'Chinese Whiskey', 'Lebanese Whiskey',
        'Tasmanian Whiskey', 'Sri Lanka Whiskey', 'Blended Chinese Whiskey',
        'Blended Taiwanese Whiskey', 'Blended Indian Whiskey', 'Blended French Whiskey',
    ]
    if name in world_types:
        pos = pos_name.upper()
        if 'SINGLE MALT' in pos:                                         return SINGLE_MALT
        if 'SINGLE GRAIN' in pos:                                        return SINGLE_GRAIN
        if any(x in pos for x in ['PURE MALT', 'BLENDED MALT', 'VATTED MALT']):
            return BLENDED_MALT
        if 'BLEND' in name.upper():                                      return BLENDED_MALT
        return SINGLE_MALT

    return OTHER


# =============================================================================
# MAIN
# =============================================================================

df = pd.read_excel(FILE, sheet_name=SHEET, engine='openpyxl')
total_input = len(df)

# STEP 1: EXCLUSIONS
name_excl = ['Cane Spirit', 'Fruit Spirit', 'Assorted Whiskey']
pos_excl   = ['3 Pack', '4 Pack', 'Twinset', 'Sampler', 'Greatest Hits 10 Pack',
               'Gift Mini Set', 'Monopolowa', 'HKB Hong-Kong']

mask_name = df['Name'].isin(name_excl)
pos_pattern = '|'.join(re.escape(p) for p in pos_excl)
mask_pos  = df['POS_Name'].str.contains(pos_pattern, case=False, na=False)
rows_excluded = int((mask_name | mask_pos).sum())
df = df[~(mask_name | mask_pos)].copy()

# STEP 2: DEDUPLICATION
df['_size_rank'] = df['Size'].apply(size_rank)
df_sorted = df.sort_values('_size_rank')

upc_map = df.groupby('POS_Name')['UPC_A'].apply(collect_upcs)

canonical = df_sorted.drop_duplicates(subset='POS_Name', keep='first').copy()
canonical['all_upcs'] = canonical['POS_Name'].map(upc_map)
unique_products = len(canonical)

# STEP 3: PROOF
canonical['proof'] = (canonical['ABV'] * 2).round(1)

# STEP 4: COUNTRY → CATEGORY / REGION
canonical[['category', 'region']] = canonical['Country'].apply(
    lambda c: pd.Series(map_country(c))
)
canonical['sub_region'] = 'Other'

# STEP 5: CLASSIFY TYPE
canonical['whiskey_type_id'] = canonical.apply(
    lambda r: classify_type(r['Name'], r['POS_Name'], r['Brand_Line'], r['Country']),
    axis=1,
)

# STEP 6: OUTPUT
os.makedirs(OUTPUT_DIR, exist_ok=True)

whiskeys = canonical[['POS_Name', 'Brand_Line', 'proof', 'category', 'region',
                       'sub_region', 'whiskey_type_id', 'all_upcs']].copy()
whiskeys.columns = ['pos_name', 'brand_line', 'proof', 'category', 'region',
                    'sub_region', 'whiskey_type_id', 'all_upcs']
whiskeys.to_csv(os.path.join(OUTPUT_DIR, 'whiskeys_staging.csv'), index=False)

barcode_rows = []
for _, row in canonical.iterrows():
    upcs_str = row['all_upcs']
    if not upcs_str:
        continue
    for upc in upcs_str.split('|'):
        upc = upc.strip()
        if upc:
            barcode_rows.append({'barcode': upc, 'pos_name': row['POS_Name']})

barcodes_df = pd.DataFrame(barcode_rows)
barcodes_df.to_csv(os.path.join(OUTPUT_DIR, 'barcodes_staging.csv'), index=False)

# STEP 7: SUMMARY
print(f"Total input rows:        {total_input}")
print(f"Rows excluded:           {rows_excluded}")
print(f"Unique products (dedup): {unique_products}")
print(f"Barcode rows written:    {len(barcodes_df)}")

print("\n--- Category breakdown ---")
for cat, cnt in canonical['category'].value_counts().items():
    print(f"  {cnt:>5}  {cat}")

print("\n--- Whiskey type breakdown ---")
for tid, cnt in canonical['whiskey_type_id'].value_counts().items():
    print(f"  {cnt:>5}  {UUID_NAMES.get(tid, tid)}")

other_count = int((canonical['whiskey_type_id'] == OTHER).sum())
print(f"\nRecords with OTHER type (need review): {other_count}")
if other_count > 0:
    cols = ['POS_Name', 'Name', 'Country']
    print(canonical[canonical['whiskey_type_id'] == OTHER][cols].to_string(index=False))
