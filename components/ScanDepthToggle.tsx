"use client";

import type { ScanDepth } from "@/lib/types";

export const SCAN_DEPTH_OPTIONS: { value: ScanDepth; label: string; hint: string }[] = [
  { value: 150, label: "Quick scan", hint: "up to 150 comments" },
  { value: 500, label: "Deep scan", hint: "up to 500 comments" },
];

interface ScanDepthToggleProps {
  scanDepth: ScanDepth;
  onScanDepthChange: (depth: ScanDepth) => void;
  disabled?: boolean;
}

export default function ScanDepthToggle({ scanDepth, onScanDepthChange, disabled }: ScanDepthToggleProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:justify-start">
      {SCAN_DEPTH_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onScanDepthChange(option.value)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            scanDepth === option.value
              ? "border-accent bg-accent/15 text-accent-strong"
              : "border-border text-muted hover:border-border-strong hover:text-foreground"
          }`}
        >
          {option.label} <span className="text-faint">· {option.hint}</span>
        </button>
      ))}
    </div>
  );
}
