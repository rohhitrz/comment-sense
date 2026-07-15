"use client";

import { useEffect, useState } from "react";
import type { ScanDepth } from "@/lib/types";

interface LoadingStateProps {
  scanDepth: ScanDepth;
  /** Defaults to "single" — omit for the existing single-video loading behavior. */
  mode?: "single" | "compare";
  /** Number of videos being processed; only used when mode is "compare". */
  videoCount?: number;
}

const STAGES: Record<ScanDepth, { at: number; label: string }[]> = {
  150: [
    { at: 0, label: "Fetching comments…" },
    { at: 4000, label: "Classifying sentiment & themes…" },
    { at: 12000, label: "Clustering audience feedback…" },
    { at: 20000, label: "Drafting suggested replies…" },
  ],
  500: [
    { at: 0, label: "Deep scan: fetching up to 500 comments…" },
    { at: 5000, label: "Classifying sentiment & themes…" },
    { at: 16000, label: "Clustering audience feedback…" },
    { at: 26000, label: "Drafting suggested replies…" },
  ],
};

const EXPECTED_DURATION: Record<ScanDepth, string> = {
  150: "20-30 seconds",
  500: "30-45 seconds",
};

function compareStages(videoCount: number): { at: number; label: string }[] {
  return [
    { at: 0, label: `Analyzing ${videoCount} videos…` },
    { at: 6000, label: "Classifying comments across all videos…" },
    { at: 20000, label: "Clustering themes per video…" },
    { at: 35000, label: "Finding patterns across videos…" },
  ];
}

export default function LoadingState({ scanDepth, mode = "single", videoCount }: LoadingStateProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const stages = mode === "compare" ? compareStages(videoCount ?? 2) : STAGES[scanDepth];

  useEffect(() => {
    const timers = stages.slice(1).map((stage, i) => setTimeout(() => setStageIndex(i + 1), stage.at));
    return () => timers.forEach(clearTimeout);
  }, [stages]);

  const subtext =
    mode === "compare"
      ? `Analyzing up to ${scanDepth} comments per video across ${videoCount ?? 2} videos — this can take a couple of minutes`
      : `Analyzing up to ${scanDepth} comments — this usually takes ${EXPECTED_DURATION[scanDepth]}`;

  return (
    <div className="flex w-full flex-col items-center gap-6 py-16">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-medium text-foreground">{stages[stageIndex].label}</p>
        <p className="text-sm text-faint">
          {subtext}
          <span className="pulse-dot ml-0.5">.</span>
          <span className="pulse-dot ml-0.5" style={{ animationDelay: "0.2s" }}>
            .
          </span>
          <span className="pulse-dot ml-0.5" style={{ animationDelay: "0.4s" }}>
            .
          </span>
        </p>
      </div>
    </div>
  );
}
