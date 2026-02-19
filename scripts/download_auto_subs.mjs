import fs from "fs";
import { spawnSync } from "child_process";

const inputPath = "data/youtube_playlist_export.json";
if (!fs.existsSync(inputPath)) {
  console.error("Missing:", inputPath);
  process.exit(1);
}

const videos = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const urls = videos
  .map((v) => v?.url)
  .filter(Boolean);

console.log(`Found ${urls.length} video URLs in ${inputPath}`);
console.log("Downloading auto-subs (.vtt) into transcripts/ ...");

let ok = 0;
let fail = 0;

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  const idx = String(i + 1).padStart(3, "0");
  console.log(`\n[${idx}/${urls.length}] ${url}`);

  // yt-dlp will save: transcripts/<videoId>.en.vtt (or similar)
  const args = [
    "--skip-download",
    "--write-auto-sub",
    "--sub-lang", "en",
    "--sub-format", "vtt",
    "-o", "transcripts/%(id)s.%(ext)s",
    url,
  ];

  const r = spawnSync("yt-dlp", args, { stdio: "inherit", shell: true });

  if (r.status === 0) ok++;
  else fail++;
}

console.log("\nDONE");
console.log(`Success: ${ok}`);
console.log(`Failed:  ${fail}`);
console.log("Check transcripts/ folder for .vtt files.");
