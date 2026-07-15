"use client";

import type { ScanDepth } from "@/lib/types";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  scanDepth: ScanDepth;
  onScanDepthChange: (depth: ScanDepth) => void;
}

const SCAN_DEPTH_OPTIONS: { value: ScanDepth; label: string; hint: string }[] = [
  { value: 150, label: "Quick scan", hint: "up to 150 comments" },
  { value: 500, label: "Deep scan", hint: "up to 500 comments" },
];

export default function UrlInput({
  value,
  onChange,
  onSubmit,
  disabled,
  scanDepth,
  onScanDepthChange,
}: UrlInputProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full flex-1 rounded-xl border border-border bg-surface px-5 py-4 text-base text-foreground placeholder:text-faint outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          className="shrink-0 rounded-xl bg-accent px-7 py-4 text-base font-medium text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analyze
        </button>
      </div>

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
    </form>
  );
}
