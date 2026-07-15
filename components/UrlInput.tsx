"use client";

import type { ScanDepth } from "@/lib/types";
import ScanDepthToggle from "./ScanDepthToggle";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  scanDepth: ScanDepth;
  onScanDepthChange: (depth: ScanDepth) => void;
}

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

      <ScanDepthToggle scanDepth={scanDepth} onScanDepthChange={onScanDepthChange} disabled={disabled} />
    </form>
  );
}
