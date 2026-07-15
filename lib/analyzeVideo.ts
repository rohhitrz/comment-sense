import { extractVideoId, fetchTopComments, fetchVideoMeta } from "./youtube";
import { classifyComments, computeSentimentBreakdown, generateClusterReply, generateTopQuestions, groupByTheme } from "./classify";
import type { AnalyzeResult, Cluster, Theme } from "./types";

const CLUSTER_ORDER: Theme[] = ["praise", "question", "request", "complaint", "other"];
const CLUSTER_LABELS: Record<Theme, string> = {
  praise: "Praise",
  question: "Questions & Confusion",
  request: "Requests",
  complaint: "Complaints",
  other: "Other",
};
const TOP_COMMENTS_PER_CLUSTER = 5;

/**
 * Runs the full single-video pipeline: fetch metadata + comments, classify, cluster,
 * and generate per-cluster replies and top questions. Shared by /api/analyze and /api/compare
 * so both routes run the exact same analysis for a video.
 */
export async function analyzeVideo(videoUrl: string, maxComments: number): Promise<AnalyzeResult> {
  const videoId = extractVideoId(videoUrl);
  const meta = await fetchVideoMeta(videoId);
  const comments = await fetchTopComments(videoId, maxComments);

  const classified = await classifyComments(comments);
  const sentiment = computeSentimentBreakdown(classified);
  const groups = groupByTheme(classified);

  const clusters = await Promise.all(
    CLUSTER_ORDER.map(async (theme): Promise<Cluster | null> => {
      const members = groups[theme];
      if (members.length === 0) {
        return null;
      }

      const topComments = members.slice(0, TOP_COMMENTS_PER_CLUSTER).map((c) => ({
        author: c.author,
        text: c.text,
        likeCount: c.likeCount,
      }));

      const suggestedReply =
        theme === "other" ? null : await generateClusterReply(CLUSTER_LABELS[theme], meta.title, topComments);

      return {
        theme,
        label: CLUSTER_LABELS[theme],
        count: members.length,
        topComments,
        suggestedReply,
      };
    })
  );

  const topQuestions = await generateTopQuestions(groups.question, meta.title);

  return {
    video: { ...meta, commentCountAnalyzed: comments.length },
    sentiment,
    clusters: clusters.filter((c): c is Cluster => c !== null),
    topQuestions,
    comments: classified,
  };
}
