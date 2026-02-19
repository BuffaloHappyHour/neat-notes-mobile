// lib/catalog/whiskeyCatalogUtils.ts

export function normalizeWhiskeyName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function whiskeyIdFromName(name: string) {
  const n = normalizeWhiskeyName(name);
  const slug = n
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return `w_${slug || "unknown"}`;
}
