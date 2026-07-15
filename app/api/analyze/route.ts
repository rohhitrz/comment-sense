import { NextResponse } from "next/server";
import { extractVideoId, fetchTopComments, fetchVideoMeta, YouTubeError } from "@/lib/youtube";
import {
  classifyComments,
  computeSentimentBreakdown,
  generateClusterReply,
  generateTopQuestions,
  groupByTheme,
} from "@/lib/classify";
import type { AnalyzeResult, Cluster, Theme } from "@/lib/types";

export const dynamic = "force-dynamic";

const CLUSTER_ORDER: Theme[] = ["praise", "question", "request", "complaint", "other"];
const CLUSTER_LABELS: Record<Theme, string> = {
  praise: "Praise",
  question: "Questions & Confusion",
  request: "Requests",
  complaint: "Complaints",
  other: "Other",
};
const TOP_COMMENTS_PER_CLUSTER = 5;
const ALLOWED_MAX_COMMENTS = [150, 500];
const DEFAULT_MAX_COMMENTS = 150;

function errorStatus(code: YouTubeError["code"]): number {
  switch (code) {
    case "INVALID_URL":
      return 400;
    case "VIDEO_NOT_FOUND":
      return 404;
    case "COMMENTS_DISABLED":
      return 403;
    case "QUOTA_EXCEEDED":
      return 429;
    default:
      return 502;
  }
}

export async function POST(request: Request) {
  let videoUrl: unknown;
  let maxComments = DEFAULT_MAX_COMMENTS;
  try {
    const body = (await request.json()) as { videoUrl?: unknown; maxComments?: unknown };
    videoUrl = body.videoUrl;
    if (ALLOWED_MAX_COMMENTS.includes(body.maxComments as number)) {
      maxComments = body.maxComments as number;
    }
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof videoUrl !== "string" || videoUrl.trim().length === 0) {
    return NextResponse.json({ error: "Please provide a YouTube video URL." }, { status: 400 });
  }

  try {
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

    const result: AnalyzeResult = {
      video: { ...meta, commentCountAnalyzed: comments.length },
      sentiment,
      clusters: clusters.filter((c): c is Cluster => c !== null),
      topQuestions,
    };

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof YouTubeError) {
      return NextResponse.json({ error: err.message }, { status: errorStatus(err.code) });
    }

    console.error("Analyze route failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while analyzing this video. Please try again." },
      { status: 500 }
    );
  }
}
