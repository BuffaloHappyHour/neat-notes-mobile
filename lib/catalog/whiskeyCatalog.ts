// lib/catalog/whiskeyCatalog.ts
import { normalizeWhiskeyName, whiskeyIdFromName } from "./whiskeyCatalogUtils";
import { db, getMetaFlag, setMetaFlag, initDb } from "../db";

/**
 * Ensures the local catalog table exists and is valid.
 * If an older/bad schema exists (missing normalizedName), it auto-repairs by dropping/recreating whiskeys.
 * This DOES NOT touch tastings or bhh_reviews.
 */

async function createWhiskeysTableAndIndex() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS whiskeys (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      normalizedName TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_whiskeys_normalizedName
      ON whiskeys(normalizedName);
  `);
}

async function forceRecreateWhiskeysTable() {
  // Drop and rebuild ONLY the catalog table
  await db.execAsync(`DROP TABLE IF EXISTS whiskeys;`);
  await createWhiskeysTableAndIndex();

  // Force reseed next time
  await setMetaFlag("whiskeyCatalogSeeded", false);
}

export async function ensureWhiskeyCatalogReady(discoverNames: string[] = []) {
  await initDb();

  try {
    await createWhiskeysTableAndIndex();
  } catch (e: any) {
    const msg = String(e?.message ?? e);

    // This catches the exact failure you're seeing: old/bad schema
    if (msg.toLowerCase().includes("no such column") || msg.toLowerCase().includes("normalized")) {
      console.warn("Repairing whiskeys catalog table due to schema mismatch:", msg);
      await forceRecreateWhiskeysTable();
    } else {
      throw e;
    }
  }

  await seedWhiskeyCatalogIfNeeded(discoverNames);
}

export async function seedWhiskeyCatalogIfNeeded(discoverNames: string[] = []) {
  const seeded = await getMetaFlag("whiskeyCatalogSeeded");
  if (seeded) return;

  // Pull distinct names from BHH reviews (already imported)
  const bhhRows = await db.getAllAsync<{ whiskeyName: string }>(
    `SELECT DISTINCT whiskeyName
     FROM bhh_reviews
     WHERE whiskeyName IS NOT NULL AND TRIM(whiskeyName) != ''`
  );

  const bhhNames = bhhRows.map(r => r.whiskeyName);

  // Combine with optional Discover names later
  const all = [...bhhNames, ...discoverNames]
    .map(n => (n ?? "").trim())
    .filter(Boolean);

  // De-dupe by normalized name
  const uniq = new Map<string, string>();
  for (const name of all) {
    const norm = normalizeWhiskeyName(name);
    if (!uniq.has(norm)) uniq.set(norm, name);
  }

  await db.withTransactionAsync(async () => {
    for (const [, displayName] of uniq.entries()) {
      const norm = normalizeWhiskeyName(displayName);
      const id = whiskeyIdFromName(displayName);

      await db.runAsync(
        `INSERT OR IGNORE INTO whiskeys (id, name, normalizedName) VALUES (?, ?, ?)`,
        [id, displayName, norm]
      );
    }
  });

  await setMetaFlag("whiskeyCatalogSeeded", true);
}

export async function searchWhiskeyCatalog(query: string) {
  const q = normalizeWhiskeyName(query);
  if (!q) return [];

  const like = `${q}%`;

  return db.getAllAsync<{ id: string; name: string }>(
    `SELECT id, name
     FROM whiskeys
     WHERE normalizedName LIKE ?
     ORDER BY name
     LIMIT 12`,
    [like]
  );
}

