export type Sentiment = "positive" | "neutral" | "negative";

export type Theme = "praise" | "question" | "request" | "complaint" | "other";

export type ScanDepth = 150 | 500;

export interface VideoMeta {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export interface RawComment {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export interface ClassifiedComment extends RawComment {
  sentiment: Sentiment;
  theme: Theme;
}

export interface ClusterComment {
  author: string;
  text: string;
  likeCount: number;
}

export interface Cluster {
  theme: Theme;
  label: string;
  count: number;
  topComments: ClusterComment[];
  suggestedReply: string | null;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface AnalyzeResult {
  video: VideoMeta & { commentCountAnalyzed: number };
  sentiment: SentimentBreakdown;
  clusters: Cluster[];
  topQuestions: string[];
  comments: ClassifiedComment[];
}

export interface AnalyzeError {
  error: string;
}
