import { config } from "dotenv";
config({ path: ".env.local" });

import { extractVideoId, fetchTopComments, fetchVideoMeta } from "../lib/youtube";
import {
  classifyComments,
  computeSentimentBreakdown,
  generateClusterReply,
  generateTopQuestions,
  groupByTheme,
} from "../lib/classify";
import type { Theme } from "../lib/types";

const LABELS: Record<Theme, string> = {
  praise: "Praise",
  question: "Questions & Confusion",
  request: "Requests",
  complaint: "Complaints",
  other: "Other",
};

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx scripts/test-classify.ts <youtube-url>");
    process.exit(1);
  }

  const videoId = extractVideoId(url);
  const meta = await fetchVideoMeta(videoId);
  const comments = await fetchTopComments(videoId);
  console.log(`Fetched ${comments.length} comments for "${meta.title}"`);

  const start = Date.now();
  const classified = await classifyComments(comments);
  console.log(`Classified ${classified.length} comments in ${Date.now() - start}ms`);

  const sentiment = computeSentimentBreakdown(classified);
  console.log("sentiment breakdown:", sentiment);

  const groups = groupByTheme(classified);
  for (const theme of Object.keys(groups) as Theme[]) {
    console.log(`${LABELS[theme]}: ${groups[theme].length} comments`);
  }

  console.log("\nsample classified comments:");
  console.log(classified.slice(0, 5).map((c) => ({ text: c.text.slice(0, 60), sentiment: c.sentiment, theme: c.theme })));

  const praiseTop = groups.praise.slice(0, 5).map((c) => ({ author: c.author, text: c.text, likeCount: c.likeCount }));
  if (praiseTop.length > 0) {
    const reply = await generateClusterReply(LABELS.praise, meta.title, praiseTop);
    console.log("\nPraise suggested reply:\n", reply);
  }

  const questions = await generateTopQuestions(groups.question, meta.title);
  console.log("\nTop questions:\n", questions);
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
