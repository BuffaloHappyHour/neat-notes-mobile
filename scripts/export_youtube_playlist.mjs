import fs from "fs";

const API_KEY = process.env.YT_API_KEY;
const PLAYLIST_ID = process.env.YT_PLAYLIST_ID;

if (!API_KEY) {
  console.error("Missing YT_API_KEY env var");
  process.exit(1);
}
if (!PLAYLIST_ID) {
  console.error("Missing YT_PLAYLIST_ID env var");
  process.exit(1);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  let pageToken = "";
  const rows = [];

  while (true) {
    const url =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      `?part=snippet,contentDetails&maxResults=50&playlistId=${PLAYLIST_ID}` +
      `&key=${API_KEY}` +
      (pageToken ? `&pageToken=${pageToken}` : "");

    const data = await fetchJson(url);

    for (const item of data.items ?? []) {
      const sn = item.snippet ?? {};
      const cd = item.contentDetails ?? {};
      const videoId = cd.videoId || (sn.resourceId ? sn.resourceId.videoId : "");

      rows.push({
        videoId,
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
        title: sn.title ?? "",
        publishedAt: cd.videoPublishedAt ?? sn.publishedAt ?? "",
        description: sn.description ?? "",
      });
    }

    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  // Write JSON (best for parsing)
  fs.writeFileSync("data/youtube_playlist_export.json", JSON.stringify(rows, null, 2), "utf8");

  // Write CSV (easy to view)
  const header = ["videoId", "url", "title", "publishedAt", "description"];
  const csvLines = [header.join(",")];

  for (const r of rows) {
    csvLines.push(
      header.map((k) => csvEscape(r[k])).join(",")
    );
  }

  fs.writeFileSync("data/youtube_playlist_export.csv", csvLines.join("\n"), "utf8");

  console.log(`Exported ${rows.length} videos to:`);
  console.log(" - data/youtube_playlist_export.json");
  console.log(" - data/youtube_playlist_export.csv");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
