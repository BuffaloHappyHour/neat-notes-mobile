// scripts/build-bhh-reviews-json.mjs
// Builds data/bhh_reviews.json from data/youtube_playlist_export.json
// Ratings will be null for now (we'll patch scores in the next step).

import fs from "fs";
import path from "path";

function canonicalizeWhiskeyName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\b(buffalo happy hour|review|wednesday whiskey review)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function guessWhiskeyNameFromTitle(title) {
  const t = String(title || "").trim();
  if (!t) return "Unknown Whiskey";

  // common pattern: "Wednesday WHISKEY Review: <WHISKEY NAME> - Buffalo Happy Hour"
  const afterColon = t.includes(":") ? t.split(":").slice(1).join(":").trim() : t;
  const beforeDash = afterColon.includes(" - ") ? afterColon.split(" - ")[0].trim() : afterColon;
  return beforeDash.replace(/\s+/g, " ").trim();
}

function pickVideoId(v) {
  return (
    v.videoId ||
    v.video_id ||
    v.id ||
    v.contentDetails?.videoId ||
    v.snippet?.resourceId?.videoId ||
    ""
  );
}

function pickTitle(v) {
  return v.title || v.videoTitle || v.snippet?.title || "";
}

function pickPublishedAt(v) {
  return v.publishedAt || v.published_at || v.snippet?.publishedAt || null;
}

function pickThumb(v) {
  const t = v.thumbnailUrl || v.thumbnail_url || v.snippet?.thumbnails;
  if (!t) return null;
  if (typeof t === "string") return t;
  return t?.high?.url || t?.medium?.url || t?.default?.url || null;
}

async function main() {
  const inPath = path.resolve("data", "youtube_playlist_export.json");
  const outPath = path.resolve("data", "bhh_reviews.json");

  if (!fs.existsSync(inPath)) {
    console.error(`Missing input file: ${inPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inPath, "utf8");
  const json = JSON.parse(raw);

  const arr = Array.isArray(json) ? json : json?.items;
  if (!Array.isArray(arr)) {
    console.error("Unexpected JSON format. Expected an array or { items: [...] }.");
    process.exit(1);
  }

  const mapped = arr
    .map((v) => {
      const videoId = pickVideoId(v);
      const videoTitle = pickTitle(v);
      if (!videoId || !videoTitle) return null;

      const whiskeyName = guessWhiskeyNameFromTitle(videoTitle);

      return {
        video_id: String(videoId),
        video_title: String(videoTitle),
        published_at: pickPublishedAt(v),
        whiskey_name: whiskeyName,
        whiskey_canonical: canonicalizeWhiskeyName(whiskeyName),
        distillery: null,
        whiskey_type: null,
        proof: null,
        age: null,
        rating_100: null, // we will fill this in with your score extraction next
        summary: null,
        notes: null,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: pickThumb(v),
      };
    })
    .filter(Boolean);

  fs.writeFileSync(outPath, JSON.stringify(mapped, null, 2), "utf8");

  console.log(`✅ Wrote ${mapped.length} rows to ${outPath}`);
}

main().catch((e) => {
  console.error("❌ Build failed:", e?.message || e);
  process.exit(1);
});
