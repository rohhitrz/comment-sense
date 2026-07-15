import { NextResponse } from "next/server";
import { extractVideoId, YouTubeError } from "@/lib/youtube";
import { analyzeVideo } from "@/lib/analyzeVideo";
import type { AnalyzeResult, CompareResult, CrossVideoInsights, SkippedVideo } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_MAX_COMMENTS = [150, 500];
const DEFAULT_MAX_COMMENTS = 150;
const MIN_VIDEOS = 2;
const MAX_VIDEOS = 5;

const INSUFFICIENT_DATA_INSIGHTS: CrossVideoInsights = {
  recurringComplaints: [],
  recurringRequests: [],
  trend: null,
  recommendation:
    "Not enough videos were successfully analyzed to detect cross-video patterns. Try again with at least two videos that have comments enabled.",
};

// TODO(step 2): replace with a real cross-video synthesis LLM call.
async function generateCrossVideoInsightsStub(_videos: AnalyzeResult[]): Promise<CrossVideoInsights> {
  return {
    recurringComplaints: [],
    recurringRequests: [],
    trend: null,
    recommendation: "Cross-video synthesis not yet implemented.",
  };
}

export async function POST(request: Request) {
  let videoUrls: unknown;
  let maxComments = DEFAULT_MAX_COMMENTS;
  try {
    const body = (await request.json()) as { videoUrls?: unknown; maxComments?: unknown };
    videoUrls = body.videoUrls;
    if (ALLOWED_MAX_COMMENTS.includes(body.maxComments as number)) {
      maxComments = body.maxComments as number;
    }
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!Array.isArray(videoUrls) || !videoUrls.every((u) => typeof u === "string")) {
    return NextResponse.json({ error: "Please provide a list of YouTube video URLs." }, { status: 400 });
  }

  const trimmedUrls = videoUrls.map((u) => u.trim()).filter((u) => u.length > 0);

  if (trimmedUrls.length < MIN_VIDEOS || trimmedUrls.length > MAX_VIDEOS) {
    return NextResponse.json(
      { error: `Please provide between ${MIN_VIDEOS} and ${MAX_VIDEOS} video URLs.` },
      { status: 400 }
    );
  }

  const skipped: SkippedVideo[] = [];
  const seenVideoIds = new Set<string>();
  const toProcess: { url: string; videoId: string }[] = [];

  for (const url of trimmedUrls) {
    let videoId: string;
    try {
      videoId = extractVideoId(url);
    } catch (err) {
      skipped.push({ videoId: null, reason: err instanceof YouTubeError ? err.message : "Invalid URL." });
      continue;
    }
    if (seenVideoIds.has(videoId)) {
      skipped.push({ videoId, reason: "Duplicate of another video in this comparison." });
      continue;
    }
    seenVideoIds.add(videoId);
    toProcess.push({ url, videoId });
  }

  const settled = await Promise.all(
    toProcess.map(async ({ url, videoId }) => {
      try {
        const result = await analyzeVideo(url, maxComments);
        return { ok: true as const, result };
      } catch (err) {
        const reason = err instanceof YouTubeError ? err.message : "Something went wrong analyzing this video.";
        return { ok: false as const, videoId, reason };
      }
    })
  );

  const videos: AnalyzeResult[] = [];
  for (const outcome of settled) {
    if (outcome.ok) {
      videos.push(outcome.result);
    } else {
      skipped.push({ videoId: outcome.videoId, reason: outcome.reason });
    }
  }

  const crossVideoInsights =
    videos.length >= 2 ? await generateCrossVideoInsightsStub(videos) : INSUFFICIENT_DATA_INSIGHTS;

  const response: CompareResult = { videos, skipped, crossVideoInsights };
  return NextResponse.json(response);
}
