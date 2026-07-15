import { NextResponse } from "next/server";
import { YouTubeError } from "@/lib/youtube";
import { analyzeVideo } from "@/lib/analyzeVideo";

export const dynamic = "force-dynamic";

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
    const result = await analyzeVideo(videoUrl, maxComments);
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
