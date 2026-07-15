import OpenAI from "openai";
import type {
  AnalyzeResult,
  ClassifiedComment,
  ClusterComment,
  CrossVideoInsights,
  RawComment,
  Sentiment,
  SentimentBreakdown,
  Theme,
} from "./types";

const MODEL = "gpt-4o-mini";
const BATCH_SIZE = 25;
const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];
const THEMES: Theme[] = ["praise", "question", "request", "complaint", "other"];

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured on the server.");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

interface ClassificationResultItem {
  id: string;
  sentiment: string;
  theme: string;
}

interface ClassificationResponse {
  results: ClassificationResultItem[];
}

function fallbackClassify(batch: RawComment[]): ClassifiedComment[] {
  return batch.map((c) => ({ ...c, sentiment: "neutral", theme: "other" }));
}

async function classifyBatchOnce(batch: RawComment[]): Promise<ClassifiedComment[]> {
  const openai = getClient();

  const input = batch.map((c) => ({ id: c.id, text: c.text.slice(0, 1000) }));

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a precise classification engine for YouTube comments. " +
          "For each comment, determine its sentiment and theme. " +
          `sentiment must be one of: ${SENTIMENTS.join(", ")}. ` +
          `theme must be one of: ${THEMES.join(", ")}. ` +
          "praise = compliments/appreciation, question = asking something or expressing confusion, " +
          "request = asking for a future video/feature/topic, complaint = criticism or negative feedback, " +
          "other = anything that doesn't fit cleanly. " +
          "Respond with strict JSON only, matching this shape: " +
          '{ "results": [ { "id": string, "sentiment": string, "theme": string } ] }. ' +
          "Return exactly one result per input comment, preserving its id.",
      },
      {
        role: "user",
        content: JSON.stringify({ comments: input }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from classification call.");
  }

  const parsed = JSON.parse(content) as ClassificationResponse;
  const byId = new Map(parsed.results.map((r) => [r.id, r]));

  return batch.map((c) => {
    const result = byId.get(c.id);
    const sentiment = SENTIMENTS.includes(result?.sentiment as Sentiment) ? (result!.sentiment as Sentiment) : "neutral";
    const theme = THEMES.includes(result?.theme as Theme) ? (result!.theme as Theme) : "other";
    return { ...c, sentiment, theme };
  });
}

async function classifyBatchWithRetry(batch: RawComment[]): Promise<ClassifiedComment[]> {
  try {
    return await classifyBatchOnce(batch);
  } catch {
    try {
      return await classifyBatchOnce(batch);
    } catch {
      return fallbackClassify(batch);
    }
  }
}

export async function classifyComments(comments: RawComment[]): Promise<ClassifiedComment[]> {
  const batches = chunk(comments, BATCH_SIZE);
  const results = await Promise.all(batches.map((batch) => classifyBatchWithRetry(batch)));
  return results.flat();
}

export function computeSentimentBreakdown(classified: ClassifiedComment[]): SentimentBreakdown {
  const breakdown: SentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  for (const c of classified) {
    breakdown[c.sentiment] += 1;
  }
  return breakdown;
}

export function groupByTheme(classified: ClassifiedComment[]): Record<Theme, ClassifiedComment[]> {
  const groups: Record<Theme, ClassifiedComment[]> = {
    praise: [],
    question: [],
    request: [],
    complaint: [],
    other: [],
  };
  for (const c of classified) {
    groups[c.theme].push(c);
  }
  for (const theme of THEMES) {
    groups[theme].sort((a, b) => b.likeCount - a.likeCount);
  }
  return groups;
}

interface ReplyResponse {
  reply: string;
}

export async function generateClusterReply(
  label: string,
  videoTitle: string,
  topComments: ClusterComment[]
): Promise<string> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write short, warm, authentic YouTube comment replies for a creator, in the creator's own voice. " +
          "Write ONE reply of 2-4 sentences that responds to the general spirit of the comments as a group, " +
          "not each one individually. Do not use more than one emoji. Never say \"As an AI\" or refer to yourself as an AI. " +
          'Respond with strict JSON only: { "reply": string }.',
      },
      {
        role: "user",
        content: JSON.stringify({
          videoTitle,
          clusterLabel: label,
          comments: topComments.map((c) => ({ author: c.author, text: c.text, likeCount: c.likeCount })),
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from reply generation call.");
  }

  const parsed = JSON.parse(content) as ReplyResponse;
  return parsed.reply.trim();
}

interface QuestionsResponse {
  questions: string[];
}

export async function generateTopQuestions(
  questionComments: ClassifiedComment[],
  videoTitle: string
): Promise<string[]> {
  if (questionComments.length === 0) {
    return [];
  }

  const openai = getClient();
  const sample = questionComments.slice(0, 30).map((c) => ({ text: c.text, likeCount: c.likeCount }));

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You distill raw YouTube comments into a clean list of the top distinct questions the audience is asking. " +
          "Paraphrase into clear, concise questions (no more than ~15 words each). Merge duplicates/near-duplicates. " +
          "Prioritize questions that are asked more often or are more liked. Return at most 5 questions, fewer if there " +
          'are not enough distinct ones. Respond with strict JSON only: { "questions": string[] }.',
      },
      {
        role: "user",
        content: JSON.stringify({ videoTitle, comments: sample }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from top questions call.");
  }

  const parsed = JSON.parse(content) as QuestionsResponse;
  return parsed.questions.slice(0, 5);
}

interface CrossVideoInsightsResponse {
  recurringComplaints?: { pattern: string; videoTitles: string[] }[];
  recurringRequests?: { pattern: string; videoTitles: string[] }[];
  trend?: string | null;
  recommendation?: string;
}

/**
 * Synthesizes patterns that repeat across multiple already-analyzed videos (same creator).
 * `videos` is expected in the order the creator pasted the URLs in, used as a recency proxy
 * for trend detection (oldest to newest as listed).
 */
export async function generateCrossVideoInsights(videos: AnalyzeResult[]): Promise<CrossVideoInsights> {
  const openai = getClient();

  const payload = videos.map((v, i) => ({
    order: i + 1,
    title: v.video.title,
    themes: v.clusters.map((c) => ({
      theme: c.theme,
      count: c.count,
      examples: c.topComments.slice(0, 3).map((tc) => tc.text),
    })),
  }));

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You analyze comment patterns across multiple YouTube videos from the same creator to find what repeats " +
          "across videos, not what's unique to one. You receive each video's title, its position in the sequence " +
          "the creator listed them in (`order` ascending = oldest to newest as pasted), and per-theme comment " +
          "counts with a few example comments per theme. Identify: " +
          "(1) recurringComplaints: complaints or confusions that show up in at least 2 of the videos, " +
          "(2) recurringRequests: requests that show up in at least 2 of the videos, " +
          "(3) trend: one notable trend across the sequence (e.g. a theme becoming more common in later videos), " +
          "or null if there isn't a clear one, " +
          "(4) recommendation: one clear, actionable recommendation (2-3 sentences) grounded only in patterns you " +
          "actually found, written like real advice to the creator, not generic filler. " +
          "Do not fabricate a pattern that isn't backed by at least 2 videos — return empty arrays if nothing recurs. " +
          'Respond with strict JSON only: { "recurringComplaints": [{ "pattern": string, "videoTitles": string[] }], ' +
          '"recurringRequests": [{ "pattern": string, "videoTitles": string[] }], "trend": string | null, ' +
          '"recommendation": string }.',
      },
      {
        role: "user",
        content: JSON.stringify({ videos: payload }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from cross-video synthesis call.");
  }

  const parsed = JSON.parse(content) as CrossVideoInsightsResponse;
  return {
    recurringComplaints: parsed.recurringComplaints ?? [],
    recurringRequests: parsed.recurringRequests ?? [],
    trend: parsed.trend ?? null,
    recommendation: parsed.recommendation ?? "No recommendation was generated.",
  };
}
