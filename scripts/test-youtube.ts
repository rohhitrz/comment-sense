import { config } from "dotenv";
config({ path: ".env.local" });

import { extractVideoId, fetchVideoMeta, fetchTopComments } from "../lib/youtube";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx scripts/test-youtube.ts <youtube-url>");
    process.exit(1);
  }

  const videoId = extractVideoId(url);
  console.log("videoId:", videoId);

  const meta = await fetchVideoMeta(videoId);
  console.log("meta:", meta);

  const comments = await fetchTopComments(videoId);
  console.log("comment count:", comments.length);
  console.log("first 3:", comments.slice(0, 3));
  console.log("last 1:", comments.slice(-1));
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
