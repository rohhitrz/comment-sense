"use client";

import { useMemo, useState } from "react";
import type { ClassifiedComment, Sentiment, Theme } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";

interface CommentBrowserProps {
  comments: ClassifiedComment[];
}

type SentimentFilter = "all" | Sentiment;
type ThemeFilter = "all" | Theme;
type SortOption = "mostLiked" | "newest" | "oldest";

const PAGE_SIZE = 25;

const SENTIMENT_BADGE: Record<Sentiment, string> = {
  positive: "bg-positive/15 text-positive",
  neutral: "bg-neutral/15 text-neutral",
  negative: "bg-negative/15 text-negative",
};

const THEME_BADGE: Record<Theme, string> = {
  praise: "bg-positive/15 text-positive",
  question: "bg-accent/15 text-accent-strong",
  request: "bg-neutral/15 text-neutral",
  complaint: "bg-negative/15 text-negative",
  other: "bg-surface-2 text-muted",
};

const THEME_LABELS: Record<Theme, string> = {
  praise: "Praise",
  question: "Question",
  request: "Request",
  complaint: "Complaint",
  other: "Other",
};

const selectClass =
  "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent";

function CommentRow({ comment }: { comment: ClassifiedComment }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = comment.text.length > 220;

  return (
    <div className="flex flex-col gap-2 border-b border-border/60 px-5 py-4 last:border-none">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">{comment.author}</span>
        <span className="shrink-0 text-xs text-faint">{formatRelativeTime(comment.publishedAt)}</span>
      </div>
      <p className={`text-sm leading-relaxed text-foreground/90 ${expanded ? "" : "line-clamp-3"}`}>
        {comment.text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs font-medium text-accent-strong hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-faint">{comment.likeCount.toLocaleString()} likes</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${SENTIMENT_BADGE[comment.sentiment]}`}>
          {comment.sentiment}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${THEME_BADGE[comment.theme]}`}>
          {THEME_LABELS[comment.theme]}
        </span>
      </div>
    </div>
  );
}

export default function CommentBrowser({ comments }: CommentBrowserProps) {
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("mostLiked");
  const [page, setPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    const filtered = comments.filter((c) => {
      if (sentimentFilter !== "all" && c.sentiment !== sentimentFilter) return false;
      if (themeFilter !== "all" && c.theme !== themeFilter) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortBy === "mostLiked") {
      sorted.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      sorted.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }
    return sorted;
  }, [comments, sentimentFilter, themeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredAndSorted.slice(startIndex, startIndex + PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sentimentFilter}
          onChange={(e) => {
            setSentimentFilter(e.target.value as SentimentFilter);
            resetPage();
          }}
          className={selectClass}
        >
          <option value="all">All sentiment</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>

        <select
          value={themeFilter}
          onChange={(e) => {
            setThemeFilter(e.target.value as ThemeFilter);
            resetPage();
          }}
          className={selectClass}
        >
          <option value="all">All themes</option>
          <option value="praise">Praise</option>
          <option value="question">Question</option>
          <option value="request">Request</option>
          <option value="complaint">Complaint</option>
          <option value="other">Other</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortOption);
            resetPage();
          }}
          className={selectClass}
        >
          <option value="mostLiked">Most liked</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-5 py-16 text-center">
            <p className="text-base font-medium text-foreground">No comments match these filters.</p>
            <p className="text-sm text-faint">Try a different sentiment or theme.</p>
          </div>
        ) : (
          pageItems.map((comment) => <CommentRow key={comment.id} comment={comment} />)
        )}
      </div>

      {filteredAndSorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-faint">
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredAndSorted.length)} of{" "}
            {filteredAndSorted.length} comments
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-muted transition hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-faint">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-muted transition hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
