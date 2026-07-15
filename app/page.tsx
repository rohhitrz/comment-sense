"use client";

import { useEffect, useState } from "react";
import UrlInput from "@/components/UrlInput";
import CompareInput from "@/components/CompareInput";
import CompareResults from "@/components/CompareResults";
import LoadingState from "@/components/LoadingState";
import SentimentChart from "@/components/SentimentChart";
import TopQuestions from "@/components/TopQuestions";
import ClusterCard from "@/components/ClusterCard";
import CommentBrowser from "@/components/CommentBrowser";
import type { AnalyzeResult, CompareResult, ScanDepth } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";
type Mode = "single" | "compare";

const SESSION_KEY = "commentsense:lastAnalysis";

interface StoredSession {
  videoUrl: string;
  scanDepth: ScanDepth;
  result: AnalyzeResult;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("single");

  const [videoUrl, setVideoUrl] = useState("");
  const [scanDepth, setScanDepth] = useState<ScanDepth>(150);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [compareUrls, setCompareUrls] = useState<string[]>(["", ""]);
  const [compareStatus, setCompareStatus] = useState<Status>("idle");
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  useEffect(() => {
    // Hydrating from sessionStorage after mount (not a lazy useState initializer)
    // to avoid an SSR/client hydration mismatch, since sessionStorage only exists client-side.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as StoredSession;
      setVideoUrl(parsed.videoUrl);
      setScanDepth(parsed.scanDepth);
      setResult(parsed.result);
      setStatus("success");
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function handleAnalyze() {
    if (!videoUrl.trim() || status === "loading") return;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, maxComments: scanDepth }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setResult(data as AnalyzeResult);
      setStatus("success");
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ videoUrl, scanDepth, result: data } satisfies StoredSession)
      );
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setVideoUrl("");
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function handleCompare() {
    const trimmed = compareUrls.map((u) => u.trim()).filter((u) => u.length > 0);
    if (trimmed.length < 2 || compareStatus === "loading") return;
    setCompareStatus("loading");
    setCompareError(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrls: trimmed, maxComments: scanDepth }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCompareError(data.error ?? "Something went wrong. Please try again.");
        setCompareStatus("error");
        return;
      }

      setCompareResult(data as CompareResult);
      setCompareStatus("success");
    } catch {
      setCompareError("Couldn't reach the server. Check your connection and try again.");
      setCompareStatus("error");
    }
  }

  function handleCompareReset() {
    setCompareStatus("idle");
    setCompareResult(null);
    setCompareError(null);
    setCompareUrls(["", ""]);
  }

  const showingSingleResult = mode === "single" && status === "success" && result;
  const showingCompareResult = mode === "compare" && compareStatus === "success" && compareResult;
  const compareVideoCount = compareUrls.filter((u) => u.trim().length > 0).length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12 sm:py-16">
      {showingSingleResult ? (
        <div className="mb-10 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Comment<span className="text-accent-strong">Sense</span>
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent-strong"
          >
            Analyze another video
          </button>
        </div>
      ) : showingCompareResult ? (
        <div className="mb-10 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Comment<span className="text-accent-strong">Sense</span>
          </span>
          <button
            type="button"
            onClick={handleCompareReset}
            className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent-strong"
          >
            Compare more videos
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 pb-4 pt-8 text-center sm:pt-16">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Comment<span className="text-accent-strong">Sense</span>
          </h1>
          <p className="max-w-xl text-lg text-muted">
            {mode === "single"
              ? "Paste a YouTube video URL and get an instant read on what your audience is saying."
              : "Compare up to 5 videos and see which complaints or requests keep coming back."}
          </p>

          <div className="mt-2 flex gap-2 rounded-lg border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === "single" ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Single video
            </button>
            <button
              type="button"
              onClick={() => setMode("compare")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === "compare" ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Compare videos
            </button>
          </div>

          {mode === "single" ? (
            <>
              <div className="mt-4 w-full max-w-2xl">
                <UrlInput
                  value={videoUrl}
                  onChange={setVideoUrl}
                  onSubmit={handleAnalyze}
                  disabled={status === "loading"}
                  scanDepth={scanDepth}
                  onScanDepthChange={setScanDepth}
                />
              </div>

              {status === "error" && error && (
                <div className="mt-4 w-full max-w-2xl rounded-xl border border-negative/30 bg-negative/10 px-5 py-4 text-sm text-negative">
                  {error}
                </div>
              )}

              {status === "loading" && <LoadingState scanDepth={scanDepth} />}
            </>
          ) : (
            <>
              <div className="mt-4 w-full max-w-2xl">
                <CompareInput
                  urls={compareUrls}
                  onUrlsChange={setCompareUrls}
                  scanDepth={scanDepth}
                  onScanDepthChange={setScanDepth}
                  onSubmit={handleCompare}
                  disabled={compareStatus === "loading"}
                />
              </div>

              {compareStatus === "error" && compareError && (
                <div className="mt-4 w-full max-w-2xl rounded-xl border border-negative/30 bg-negative/10 px-5 py-4 text-sm text-negative">
                  {compareError}
                </div>
              )}

              {compareStatus === "loading" && (
                <LoadingState scanDepth={scanDepth} mode="compare" videoCount={compareVideoCount} />
              )}
            </>
          )}
        </div>
      )}

      {showingSingleResult && result && (
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.video.thumbnail}
              alt={result.video.title}
              className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-40"
            />
            <div className="flex flex-1 flex-col gap-2">
              <h2 className="text-xl font-semibold leading-snug text-foreground">{result.video.title}</h2>
              <p className="text-sm text-muted">{result.video.channel}</p>
              <span className="w-fit rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
                {result.video.commentCountAnalyzed} comments analyzed
              </span>
            </div>
          </div>

          <section className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">Sentiment overview</h3>
            <div className="rounded-2xl border border-border bg-surface p-8">
              <SentimentChart sentiment={result.sentiment} />
            </div>
          </section>

          {result.topQuestions.length > 0 && (
            <section className="flex flex-col gap-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">
                Top audience questions
              </h3>
              <TopQuestions questions={result.topQuestions} />
            </section>
          )}

          <section className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">Comment clusters</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {result.clusters.map((cluster) => (
                <ClusterCard key={cluster.theme} cluster={cluster} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-faint">All comments</h3>
            <CommentBrowser comments={result.comments} />
          </section>
        </div>
      )}

      {showingCompareResult && compareResult && <CompareResults result={compareResult} />}
    </main>
  );
}
