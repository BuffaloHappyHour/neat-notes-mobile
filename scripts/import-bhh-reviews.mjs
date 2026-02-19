// scripts/import-bhh-reviews.mjs
// Usage:
//   node scripts/import-bhh-reviews.mjs .\data\bhh_reviews.json
//
// Reads env vars from .env.import (NOT .env)
//
// Requires env vars:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// IMPORTANT: Use the *SERVICE ROLE KEY* for imports (server-only). Never ship it in the app.

import fs from "fs";
import path from "path";
import process from "process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Force-load .env.import and override anything already set
dotenv.config({
  path: path.resolve(process.cwd(), ".env.import"),
  override: true,
});

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function canonicalizeWhiskeyName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/\(.*?\)/g, "") // remove parenthesis
    .replace(/\s+-\s+.*$/g, "") // remove anything after hyphen
    .replace(/\b(buffalo happy hour|review|wednesday whiskey review)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRow(r) {
  const whiskeyName = String(r.whiskey_name ?? r.whiskeyName ?? r.title ?? "").trim();
  const videoId = String(r.video_id ?? r.videoId ?? "").trim();
  const videoTitle = String(r.video_title ?? r.videoTitle ?? "").trim();

  if (!videoId) throw new Error("Row missing video_id/videoId");
  if (!videoTitle) throw new Error(`Row ${videoId} missing video_title/videoTitle`);
  if (!whiskeyName) throw new Error(`Row ${videoId} missing whiskey_name`);

  const publishedAt = r.published_at ?? r.publishedAt ?? null;
  const rating100 =
    r.rating_100 ?? r.rating100 ?? r.rating ?? r.score ?? null;

  const youtubeUrl =
    r.youtube_url ??
    r.youtubeUrl ??
    (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);

  return {
    video_id: videoId,
    video_title: videoTitle,
    published_at: publishedAt,
    whiskey_name: whiskeyName,
    whiskey_canonical:
      String(r.whiskey_canonical ?? r.whiskeyCanonical ?? "").trim() ||
      canonicalizeWhiskeyName(whiskeyName),
    distillery: r.distillery ?? null,
    whiskey_type: r.whiskey_type ?? r.whiskeyType ?? null,
    proof: r.proof ?? null,
    age: r.age ?? null,
    rating_100: rating100 == null ? null : Number(rating100),
    summary: r.summary ?? null,
    notes: r.notes ?? null,
    youtube_url: youtubeUrl,
    thumbnail_url: r.thumbnail_url ?? r.thumbnailUrl ?? null,
  };
}

async function upsertChunk(supabase, rows, chunkIdx, totalChunks) {
  const { error } = await supabase
    .from("bhh_reviews")
    .upsert(rows, { onConflict: "video_id" });

  if (error) throw new Error(`Upsert chunk ${chunkIdx}/${totalChunks} failed: ${error.message}`);
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.log("Usage: node scripts/import-bhh-reviews.mjs .\\data\\bhh_reviews.json");
    process.exit(1);
  }

  const SUPABASE_URL = requireEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  
  console.log("Import target:", SUPABASE_URL);


  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const filePath = path.resolve(process.cwd(), fileArg);
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);

  if (!Array.isArray(json)) {
    throw new Error("Input JSON must be an array of review objects.");
  }

  const normalized = json.map(normalizeRow);

  // chunk to avoid request limits
  const chunkSize = 100;
  const totalChunks = Math.ceil(normalized.length / chunkSize);

  console.log(`Importing ${normalized.length} reviews → ${totalChunks} chunk(s)`);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const chunk = normalized.slice(start, start + chunkSize);
    await upsertChunk(supabase, chunk, i + 1, totalChunks);
    console.log(`✅ Upserted chunk ${i + 1}/${totalChunks} (${chunk.length} rows)`);
  }

  console.log("🎉 Import complete.");
}

main().catch((e) => {
  console.error("❌ Import failed:", e.message || e);
  process.exit(1);
});
