import fs from "fs";
import path from "path";

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Heuristic: try to turn a YouTube title into a whiskey name.
// You can improve this later, but it’s good enough to import all videos now.
function guessWhiskeyNameFromTitle(title) {
  let t = String(title || "").trim();

  // Remove common wrappers / series wording (customize later if needed)
  t = t.replace(/\|/g, " - ");
  t = t.replace(/Wednesday Whiskey Reviews?/i, "");
  t = t.replace(/Whiskey Review(s)?/i, "");
  t = t.replace(/Review(s)?/i, "");
  t = t.replace(/^\s*[-:–—]\s*/g, "");
  t = t.replace(/\s+[-:–—]\s+$/g, "");
  t = t.replace(/\s{2,}/g, " ").trim();

  // If we nuked too much, fall back to original title
  if (t.length < 3) t = String(title || "").trim();
  return t;
}

function safeIsoDate(publishedAt) {
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  return d.toISOString().slice(0, 10);
}

const inputPath = path.join("data", "youtube_playlist_export.json");
if (!fs.existsSync(inputPath)) {
  console.error("Missing file:", inputPath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const videos = raw
  .filter((x) => x && x.url && x.title)
  .map((x) => {
    const whiskeyName = guessWhiskeyNameFromTitle(x.title);
    const whiskeyId = slugify(whiskeyName);

    return {
      whiskeyId,
      whiskeyName,
      reviewer: "BHH",
      score: null, // Coming Soon (we will fill via transcript extraction later)
      reviewedAt: safeIsoDate(x.publishedAt),
      youtubeUrl: x.url,
      title: x.title,
    };
  });

// Write TS file
const outPath = path.join("data", "bhhVideos.ts");
const content =
  `export type BhhVideo = {\n` +
  `  whiskeyId: string;\n` +
  `  whiskeyName: string;\n` +
  `  reviewer: "BHH";\n` +
  `  score: number | null;\n` +
  `  reviewedAt: string; // YYYY-MM-DD\n` +
  `  youtubeUrl: string;\n` +
  `  title: string;\n` +
  `};\n\n` +
  `export const BHH_VIDEOS: BhhVideo[] = ${JSON.stringify(videos, null, 2)} as any;\n`;

fs.writeFileSync(outPath, content, "utf8");

console.log(`Created ${outPath} with ${videos.length} videos.`);
console.log("Next: import it from the app (Profile tab).");
