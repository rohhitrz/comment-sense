# CommentSense

AI comment intelligence for YouTube creators. Paste a video URL, get an instant read on what your audience is saying.

## What it does

A creator pastes a YouTube video URL and picks a scan depth. CommentSense:

1. Fetches the top comments for that video via the YouTube Data API v3 — **Quick scan** (up to 150, the default) or **Deep scan** (up to 500), ordered by relevance.
2. Classifies every comment's sentiment (positive/neutral/negative) and theme (praise/question/request/complaint/other) using `gpt-4o-mini`, in batched parallel calls (25 comments per call).
3. Renders a dashboard: a sentiment breakdown chart, comments grouped into themed clusters, the top 5 questions your audience is asking, one AI-drafted suggested reply per cluster with a one-click copy button, and a full browsable table of every analyzed comment with filters, sorting, and pagination.

There is no auto-posting, no OAuth, no database, and no accounts — everything runs per-request, for one video at a time. You read the analysis and copy replies you want to post yourself. The last analysis is kept in `sessionStorage` so a refresh doesn't lose it, but nothing is ever saved server-side.

## Why it matters

Creators with any real traction get hundreds of comments per video and can't read them all. The signal that matters — "everyone is confused about X," "people keep asking for Y," "this one issue is generating complaints" — is buried under noise. CommentSense turns an unreadable comment section into a five-minute read: what people liked, what they're confused about, what they want next, and a drafted reply ready to paste in, in the creator's own voice.

## Tech stack

- **Next.js 16 (App Router)** + TypeScript (strict) + Tailwind CSS
- **YouTube Data API v3** (`videos.list`, `commentThreads.list`) via a plain API key — public data only, no OAuth
- **OpenAI `gpt-4o-mini`** with `response_format: json_object` for structured classification and reply generation
- **Recharts** for the sentiment donut chart
- No database, no auth, no server-side persistence — every request is stateless

## Project structure

```
app/
  page.tsx                 landing page + URL input + dashboard (single page)
  api/analyze/route.ts     POST { videoUrl, maxComments } -> full analysis JSON
lib/
  youtube.ts               video ID extraction, comment/metadata fetching, pagination
  classify.ts               batched LLM classification, cluster replies, top questions
  types.ts                  shared TypeScript types
  format.ts                 relative-time formatting for the comment browser
components/
  UrlInput.tsx             URL input + scan depth toggle (Quick/Deep)
  LoadingState.tsx
  SentimentChart.tsx
  TopQuestions.tsx
  ClusterCard.tsx
  CommentBrowser.tsx       filterable/sortable/paginated table of all analyzed comments
```

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

   ```
   YOUTUBE_API_KEY=your_youtube_data_api_v3_key
   OPENAI_API_KEY=your_openai_api_key
   ```

   - Get a YouTube Data API v3 key from the [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com) (enable the "YouTube Data API v3" on a project, then create an API key).
   - Get an OpenAI API key from the [OpenAI platform](https://platform.openai.com/api-keys).

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), paste a YouTube video URL (`youtube.com/watch?v=...`, `youtu.be/...`, or `youtube.com/shorts/...`), pick Quick scan or Deep scan, and click Analyze.

Both API keys are only ever read server-side inside the `/api/analyze` route handler — they are never sent to or bundled for the client.

## Deploying

Deploys to Vercel with zero configuration beyond environment variables:

1. Push this repo to GitHub and import it in Vercel, or run `vercel` from the project root.
2. In the Vercel project settings, add `YOUTUBE_API_KEY` and `OPENAI_API_KEY` as environment variables.
3. Deploy. No build configuration, database, or additional setup is required.

## Cost

Each analysis classifies comments in batches of 25 (6 parallel `gpt-4o-mini` calls for a Quick scan, ~20 for a Deep scan) plus a handful of short cluster-reply and top-questions calls. At `gpt-4o-mini` pricing this comes out to a fraction of a cent per Quick scan and still well under a few cents for a Deep scan.

## Comment ordering

Comments are fetched with `commentThreads.list?order=relevance`, YouTube's own relevance ranking (roughly correlated with engagement — likes, replies, etc.) — **not** strictly newest-first or oldest-first. Quick scan takes the top 150 by that ranking; Deep scan paginates further into it for up to 500. The comment browser lets you re-sort what was fetched by newest, oldest, or most-liked, but it can't retrieve comments outside whatever set relevance ranking already selected.

## Notes on scope

This is intentionally a single-video, single-request tool: no history, no saved videos, no accounts. The most recent analysis is cached client-side in `sessionStorage` purely so a refresh doesn't lose it — closing the tab clears it, and nothing is ever written server-side. If a batch classification call fails twice, those comments are marked as neutral/other rather than failing the whole analysis, so a flaky LLM call never breaks the dashboard.
