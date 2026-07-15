import type { RawComment, VideoMeta } from "./types";

export type YouTubeErrorCode =
  | "INVALID_URL"
  | "VIDEO_NOT_FOUND"
  | "COMMENTS_DISABLED"
  | "QUOTA_EXCEEDED"
  | "API_ERROR";

export class YouTubeError extends Error {
  code: YouTubeErrorCode;

  constructor(code: YouTubeErrorCode, message: string) {
    super(message);
    this.name = "YouTubeError";
    this.code = code;
  }
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_COMMENTS = 150;
const PAGE_SIZE = 100;

/**
 * Extracts an 11-character YouTube video ID from watch, youtu.be, and shorts URLs.
 */
export function extractVideoId(videoUrl: string): string {
  const trimmed = videoUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new YouTubeError("INVALID_URL", "That doesn't look like a valid URL.");
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isYouTubeHost = host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";

  if (!isYouTubeHost) {
    throw new YouTubeError("INVALID_URL", "Please paste a valid YouTube URL.");
  }

  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (parsed.pathname.startsWith("/shorts/")) {
    videoId = parsed.pathname.split("/").filter(Boolean)[1] ?? null;
  } else if (parsed.pathname === "/watch") {
    videoId = parsed.searchParams.get("v");
  } else if (parsed.pathname.startsWith("/embed/")) {
    videoId = parsed.pathname.split("/").filter(Boolean)[1] ?? null;
  }

  if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
    throw new YouTubeError("INVALID_URL", "Couldn't find a video ID in that URL.");
  }

  return videoId;
}

interface YouTubeApiErrorBody {
  error?: {
    code?: number;
    errors?: { reason?: string }[];
    message?: string;
  };
}

async function youtubeFetch(path: string, params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new YouTubeError("API_ERROR", "YouTube API key is not configured on the server.");
  }

  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as YouTubeApiErrorBody | null;
    const reason = body?.error?.errors?.[0]?.reason ?? "";

    if (res.status === 403 && reason === "commentsDisabled") {
      throw new YouTubeError("COMMENTS_DISABLED", "Comments are disabled for this video.");
    }
    if (res.status === 403 && (reason === "quotaExceeded" || reason === "dailyLimitExceeded")) {
      throw new YouTubeError("QUOTA_EXCEEDED", "YouTube API quota has been exceeded. Please try again later.");
    }
    if (res.status === 404) {
      throw new YouTubeError("VIDEO_NOT_FOUND", "Video not found.");
    }

    throw new YouTubeError(
      "API_ERROR",
      body?.error?.message ?? `YouTube API request failed with status ${res.status}.`
    );
  }

  return res.json();
}

interface VideosListResponse {
  items: {
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
    statistics?: {
      commentCount?: string;
    };
  }[];
}

export async function fetchVideoMeta(videoId: string): Promise<VideoMeta> {
  const data = (await youtubeFetch("videos", {
    part: "snippet,statistics",
    id: videoId,
  })) as VideosListResponse;

  const item = data.items?.[0];
  if (!item) {
    throw new YouTubeError("VIDEO_NOT_FOUND", "Video not found.");
  }

  const thumbnail =
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.default?.url ??
    "";

  return {
    id: videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail,
  };
}

interface CommentThreadsListResponse {
  items: {
    snippet: {
      topLevelComment: {
        id: string;
        snippet: {
          authorDisplayName: string;
          textDisplay: string;
          likeCount: number;
        };
      };
    };
  }[];
  nextPageToken?: string;
}

export async function fetchTopComments(videoId: string): Promise<RawComment[]> {
  const comments: RawComment[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      part: "snippet",
      videoId,
      order: "relevance",
      maxResults: String(PAGE_SIZE),
      textFormat: "plainText",
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const data = (await youtubeFetch("commentThreads", params)) as CommentThreadsListResponse;

    for (const item of data.items ?? []) {
      const top = item.snippet.topLevelComment;
      comments.push({
        id: top.id,
        author: top.snippet.authorDisplayName,
        text: top.snippet.textDisplay,
        likeCount: top.snippet.likeCount,
      });
      if (comments.length >= MAX_COMMENTS) break;
    }

    pageToken = comments.length < MAX_COMMENTS ? data.nextPageToken : undefined;
  } while (pageToken && comments.length < MAX_COMMENTS);

  return comments;
}
