"use client";

import type { ScanDepth } from "@/lib/types";
import ScanDepthToggle from "./ScanDepthToggle";

const MIN_VIDEOS = 2;
const MAX_VIDEOS = 5;

interface CompareInputProps {
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  scanDepth: ScanDepth;
  onScanDepthChange: (depth: ScanDepth) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function CompareInput({
  urls,
  onUrlsChange,
  scanDepth,
  onScanDepthChange,
  onSubmit,
  disabled,
}: CompareInputProps) {
  const filledCount = urls.filter((u) => u.trim().length > 0).length;

  function updateUrl(index: number, value: string) {
    const next = [...urls];
    next[index] = value;
    onUrlsChange(next);
  }

  function removeUrl(index: number) {
    onUrlsChange(urls.filter((_, i) => i !== index));
  }

  function addUrl() {
    if (urls.length >= MAX_VIDEOS) return;
    onUrlsChange([...urls, ""]);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex flex-col gap-3">
        {urls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-sm text-faint">Video {i + 1}</span>
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              disabled={disabled}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full flex-1 rounded-xl border border-border bg-surface px-5 py-3 text-base text-foreground placeholder:text-faint outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            />
            {urls.length > MIN_VIDEOS && (
              <button
                type="button"
                onClick={() => removeUrl(i)}
                disabled={disabled}
                aria-label={`Remove video ${i + 1}`}
                className="shrink-0 rounded-lg border border-border-strong px-3 py-3 text-sm text-muted transition hover:border-negative/40 hover:text-negative disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={addUrl}
          disabled={disabled || urls.length >= MAX_VIDEOS}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add another video
        </button>
        <span className="text-xs text-faint">
          {urls.length} of {MAX_VIDEOS} videos
        </span>
      </div>

      <ScanDepthToggle scanDepth={scanDepth} onScanDepthChange={onScanDepthChange} disabled={disabled} />

      <button
        type="submit"
        disabled={disabled || filledCount < MIN_VIDEOS}
        className="w-full rounded-xl bg-accent px-7 py-4 text-base font-medium text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
      >
        Compare videos
      </button>
    </form>
  );
}
