"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { at: 0, label: "Fetching comments…" },
  { at: 4000, label: "Classifying sentiment & themes…" },
  { at: 12000, label: "Clustering audience feedback…" },
  { at: 20000, label: "Drafting suggested replies…" },
];

export default function LoadingState() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timers = STAGES.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.at)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-6 py-16">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-medium text-foreground">{STAGES[stageIndex].label}</p>
        <p className="text-sm text-faint">
          Analyzing up to 150 comments — this usually takes 20-30 seconds
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
