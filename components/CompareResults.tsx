"use client";

import { useState } from "react";
import SentimentChart from "./SentimentChart";
import ClusterCard from "./ClusterCard";
import type { AnalyzeResult, CompareResult, RecurringPattern } from "@/lib/types";

interface CompareResultsProps {
  result: CompareResult;
}

function VideoSection({ video }: { video: AnalyzeResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.video.thumbnail}
          alt={video.video.title}
          className="h-16 w-28 shrink-0 rounded-lg object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-base font-semibold text-foreground">{video.video.title}</h3>
          <p className="text-sm text-muted">
            {video.video.channel} · {video.video.commentCountAnalyzed} comments analyzed
          </p>
        </div>
        <span className="shrink-0 text-sm text-faint">{expanded ? "Hide breakdown ▲" : "Show breakdown ▼"}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-8 border-t border-border p-5">
          <div className="rounded-2xl border border-border bg-surface-2 p-6">
            <SentimentChart sentiment={video.sentiment} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {video.clusters.map((cluster) => (
              <ClusterCard key={cluster.theme} cluster={cluster} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PatternCard({ pattern }: { pattern: RecurringPattern }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-5">
      <p className="text-sm leading-relaxed text-foreground">{pattern.pattern}</p>
      <div className="flex flex-wrap gap-2">
        {pattern.videoTitles.map((title, i) => (
          <span
            key={i}
            title={title}
            className="max-w-[220px] truncate rounded-full bg-surface px-3 py-1 text-xs text-muted"
          >
            {title}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CompareResults({ result }: CompareResultsProps) {
  const { videos, skipped, crossVideoInsights } = result;
  const hasPatterns =
    crossVideoInsights.recurringComplaints.length > 0 || crossVideoInsights.recurringRequests.length > 0;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6 rounded-2xl border border-accent/30 bg-accent/[0.06] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Across your videos</h2>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-strong">
            {videos.length} {videos.length === 1 ? "video" : "videos"} analyzed
          </span>
        </div>

        {skipped.length > 0 && (
          <div className="rounded-xl border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
            {skipped.length} {skipped.length === 1 ? "video" : "videos"} couldn&apos;t be included:{" "}
            {skipped.map((s, i) => (
              <span key={i}>
                {s.videoId ?? "an entry"} ({s.reason}){i < skipped.length - 1 ? "; " : ""}
              </span>
            ))}
          </div>
        )}

        {hasPatterns ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {crossVideoInsights.recurringComplaints.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">Recurring complaints</h3>
                <div className="flex flex-col gap-3">
                  {crossVideoInsights.recurringComplaints.map((p, i) => (
                    <PatternCard key={i} pattern={p} />
                  ))}
                </div>
              </div>
            )}
            {crossVideoInsights.recurringRequests.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">Recurring requests</h3>
                <div className="flex flex-col gap-3">
                  {crossVideoInsights.recurringRequests.map((p, i) => (
                    <PatternCard key={i} pattern={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">No recurring complaints or requests were found across these videos.</p>
        )}

        {crossVideoInsights.trend && (
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground">
            <span className="font-semibold text-accent-strong">Trend: </span>
            {crossVideoInsights.trend}
          </div>
        )}

        <div className="rounded-xl border border-accent/40 bg-accent/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">What to do next</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{crossVideoInsights.recommendation}</p>
        </div>
      </section>

      {videos.length > 0 && (
        <section className="flex flex-col gap-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">Individual video breakdowns</h3>
          <div className="flex flex-col gap-4">
            {videos.map((v) => (
              <VideoSection key={v.video.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
