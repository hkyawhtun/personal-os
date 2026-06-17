# SPEC — RSS feed subscriptions

**Lesson 5 · slide 47.** Built from this spec, then scheduled via `/loop` or `/schedule`.

## Goal
Track RSS feeds (Hacker News by default) and weave their headlines into the brief — and
have the AI **synthesize** what's notable, not just list links. Let the user add/remove
feeds.

## Data (`core/db.ts`)
- `feeds` table `{ id, url(unique), title, created }`.
- `listFeeds()`, `addFeed(url, title?)`, `deleteFeed(id)`, `seedFeedsIfEmpty()` (seeds
  `https://hnrss.org/frontpage`). Emit `feeds` change events.

## Reader (`ai/rss.ts`)
- Zero-dep tolerant parser: RSS 2.0 `<item>` first, Atom `<entry>` fallback. Capture
  `title`, `link`, `pubDate`/`updated`, and a short `summary` from `<description>`/
  `<summary>`/`<content>` (strip tags).
- `fetchFeedItems(feeds, {perFeed, total, timeoutMs})`: parallel fetch, merge,
  newest-first, cap at ~8, ~6s timeout, graceful empty on failure.

## Brief integration (`ai/brief.ts`)
- `generateBrief()` fetches feed items, attaches them to the brief (`feeds`), passes
  **titles + summaries** to the model, and asks for a `headlinesTake` — 1-2 sentences
  synthesizing what's notable, **grounded only in the provided headlines** (no invented
  news).

## UI (`src/views/FeedManager.tsx`, in the Brief view)
- A Feeds manager (add URL / remove). The brief renders a **Headlines** section with the
  AI `headlinesTake` above the linked items.
- Adding/removing a feed **regenerates** the brief so new headlines appear immediately.

## Server / agent
- `GET/POST/DELETE /api/feeds`. Agent tools `list_feeds`/`add_feed`/`remove_feed`
  ("track the Verge's RSS").

## Schedule (slide 47b)
- Use `/loop` (or `/schedule`) to generate a fresh brief on an interval — live demo.

## Done when
`GET /api/briefs/generate` returns headlines + a `headlinesTake` referencing real feed
items; adding a feed updates the brief; a scheduled run produces a brief unattended.
