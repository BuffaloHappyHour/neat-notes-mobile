import fs from "fs";
import path from "path";

const transcriptsDir = "transcripts";
const exportJson = "data/youtube_playlist_export.json";
const outTs = "data/bhhScoreUpdates.ts";
const outMissingJson = "data/bhhMissingScores.json";

const MIN_SCORE = 35; // allow low outliers
const MAX_SCORE = 100;

if (!fs.existsSync(transcriptsDir)) {
  console.error("Missing folder:", transcriptsDir);
  process.exit(1);
}
if (!fs.existsSync(exportJson)) {
  console.error("Missing:", exportJson);
  process.exit(1);
}

const playlist = JSON.parse(fs.readFileSync(exportJson, "utf8"));

// videoId -> {url,title}
const idToMeta = new Map();
for (const v of playlist) {
  if (v?.videoId && v?.url) {
    idToMeta.set(String(v.videoId), { url: String(v.url), title: String(v.title || "") });
  }
}

function cleanVttToText(vtt) {
  return vtt
    .replace(/\r/g, "")
    .replace(/^WEBVTT.*\n+/i, "")
    .replace(/\n\d+\n/g, "\n")
    .replace(/\n\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}.*\n/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeSnippet(text, at, len = 360) {
  const start = Math.max(0, at - 80);
  return text.slice(start, start + len);
}

function allIndices(haystack, needle) {
  const out = [];
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    out.push(idx);
    from = idx + needle.length;
  }
  return out;
}

function normalizeScore(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;

  // If transcript gives 8.8 / 9.2 (0-10), convert
  if (n > 0 && n <= 10) {
    const conv = Math.round(n * 10);
    if (conv >= MIN_SCORE && conv <= MAX_SCORE) return conv;
  }

  const r = Math.round(n);
  if (r >= MIN_SCORE && r <= MAX_SCORE) return r;

  return null;
}

// Pull first digit score in range from a text window
function extractDigitScore(windowText) {
  const matches = [...windowText.matchAll(/\b(\d{1,3}(?:\.\d)?)\b/g)];
  for (const m of matches) {
    const idx = m.index ?? -1;

    // Skip the countdown if present nearby
    const around = idx >= 0 ? windowText.slice(Math.max(0, idx - 14), idx + 14) : "";
    if (/\b3\b\s*\b2\b\s*\b1\b/.test(around)) continue;

    const score = normalizeScore(m[1]);
    if (score !== null) return score;
  }
  return null;
}

// Word parsing: handle "eighty eight", "eighty-eight", "ninety", "one hundred"
const SMALL = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};

// include common caption variants for 40/80
const TENS = {
  twenty: 20, thirty: 30,
  forty: 40, fourty: 40, // misspelling sometimes appears
  fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, atee: 80, // occasional weirdness
  ninety: 90,
};

function extractWordScore(windowText) {
  const tokens = windowText
    .replace(/-/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];

    if ((w === "one" && tokens[i + 1] === "hundred") || (w === "a" && tokens[i + 1] === "hundred")) {
      const score = normalizeScore(100);
      if (score !== null) return score;
    }

    if (w in TENS) {
      let n = TENS[w];
      const next = tokens[i + 1];
      if (next && next in SMALL) n += SMALL[next];

      const score = normalizeScore(n);
      if (score !== null) return score;
    }
  }

  return null;
}

function scoreFromWindow(windowText) {
  const d = extractDigitScore(windowText);
  if (d !== null) return d;

  const w = extractWordScore(windowText);
  if (w !== null) return w;

  return null;
}

function extractScoreFromTranscript(fullText) {
  const lower = fullText.toLowerCase();

  // 1) Primary: find LAST occurrence of "final rating" (you repeat it in setup)
  const finalRatingIdxs = allIndices(lower, "final rating");
  if (finalRatingIdxs.length) {
    const idx = finalRatingIdxs[finalRatingIdxs.length - 1];
    const window = lower.slice(idx, idx + 3500);
    const score = scoreFromWindow(window);
    if (score !== null) return { score, anchor: "final rating", snippet: makeSnippet(lower, idx) };
  }

  // 2) Secondary: countdown anchor. We search AFTER it.
  const countdowns = ["three two one", "three, two, one", "3 2 1", "3, 2, 1"];
  for (const c of countdowns) {
    const idxs = allIndices(lower, c);
    if (!idxs.length) continue;

    const idx = idxs[idxs.length - 1]; // last countdown
    const after = lower.slice(idx + c.length, idx + c.length + 3500);
    const score = scoreFromWindow(after);
    if (score !== null) return { score, anchor: c, snippet: makeSnippet(lower, idx) };
  }

  // 3) Tail fallback: rating happens near end even if captions are messy
  const tailStart = Math.max(0, lower.length - 4500);
  const tail = lower.slice(tailStart);

  const score = scoreFromWindow(tail);
  if (score !== null) return { score, anchor: "tail", snippet: tail.slice(0, 360) };

  return { score: null, anchor: "", snippet: "" };
}

// ---------- main ----------
const files = fs.readdirSync(transcriptsDir).filter((f) => f.endsWith(".vtt"));
console.log(`Found ${files.length} .vtt files in ${transcriptsDir}`);

const updates = [];
const missing = [];

let found = 0;

for (const file of files) {
  const full = path.join(transcriptsDir, file);
  const videoId = file.split(".")[0];

  const meta = idToMeta.get(videoId);
  if (!meta) continue;

  const vtt = fs.readFileSync(full, "utf8");
  const text = cleanVttToText(vtt);

  const { score, anchor, snippet } = extractScoreFromTranscript(text);

  if (score === null) {
    missing.push({
      videoId,
      youtubeUrl: meta.url,
      title: meta.title,
      anchorTried: anchor,
      snippet,
    });
    continue;
  }

  found++;
  updates.push({ youtubeUrl: meta.url, score });
}

fs.writeFileSync(
  outTs,
  `export type BhhScoreUpdate = { youtubeUrl: string; score: number };\n` +
    `export const BHH_SCORE_UPDATES: BhhScoreUpdate[] = ${JSON.stringify(updates, null, 2)};\n`,
  "utf8"
);

fs.writeFileSync(outMissingJson, JSON.stringify(missing, null, 2), "utf8");

console.log(`\nExtracted scores: ${found}`);
console.log(`No score found:   ${missing.length}`);
console.log(`Wrote updates to: ${outTs}`);
console.log(`Wrote missing to: ${outMissingJson}`);

