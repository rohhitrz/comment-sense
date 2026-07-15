"use client";

import { useState } from "react";
import type { Cluster } from "@/lib/types";

interface ClusterCardProps {
  cluster: Cluster;
}

const THEME_ACCENT: Record<Cluster["theme"], string> = {
  praise: "bg-positive/15 text-positive",
  question: "bg-accent/15 text-accent-strong",
  request: "bg-neutral/15 text-neutral",
  complaint: "bg-negative/15 text-negative",
  other: "bg-surface-2 text-muted",
};

function CommentItem({ author, text }: { author: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 140;

  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3 last:border-none">
      <span className="text-sm font-medium text-muted">{author}</span>
      <p className={`text-sm leading-relaxed text-foreground/90 ${expanded ? "" : "line-clamp-3"}`}>{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 self-start text-xs font-medium text-accent-strong hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function ClusterCard({ cluster }: ClusterCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!cluster.suggestedReply) return;
    try {
      await navigator.clipboard.writeText(cluster.suggestedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied by the browser; nothing more we can do.
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{cluster.label}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${THEME_ACCENT[cluster.theme]}`}>
          {cluster.count} {cluster.count === 1 ? "comment" : "comments"}
        </span>
      </div>

      <div className="flex flex-col">
        {cluster.topComments.slice(0, 3).map((c, i) => (
          <CommentItem key={i} author={c.author} text={c.text} />
        ))}
      </div>

      {cluster.suggestedReply && (
        <div className="flex flex-col gap-3 rounded-xl border border-accent/25 bg-accent/[0.07] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Suggested reply</p>
          <p className="text-sm leading-relaxed text-foreground/95">{cluster.suggestedReply}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="self-start rounded-lg border border-border-strong bg-surface-2 px-4 py-2 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent-strong"
          >
            {copied ? "Copied!" : "Copy reply"}
          </button>
        </div>
      )}
    </div>
  );
}
