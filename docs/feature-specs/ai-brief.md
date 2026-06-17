# SPEC — AI Brief

**Lesson 5 (new slide after 44).** Built by a **parallel agent team** from this spec.
Three lanes: core/data, AI engine, web UI — against the shared contract below.

## Goal
A daily brief: reads the user's open tasks + notes and produces a short, calm digest
(focus, highlights, due-soon) with model-written prose but **computed facts** so it
can't hallucinate the schedule.

## Contract (shared types — build to these first)
```
ComputedBrief = { id, date, label, focus: string|null, lede, highlights: {h,p}[],
                  due: Task[], overdue: Task[] }
GeneratedBrief = ComputedBrief & { source: "ai"|"computed", engine }
```

## Lane A — core (`core/db.ts`)
- `computeBrief(today?)`: deterministic. focus = first priority task, else first
  due-today, else first open. highlights from overdue/due-today/inbox counts. due =
  next ≤5 upcoming. This is the **always-correct fallback**.
- `saveBrief()` / `listBriefs()` persisting the **full** brief as JSON (so history
  reloads in full). Emit a `briefs` change event.

## Lane B — AI engine (`ai/brief.ts`)
- Provider-pluggable via `POS_BRIEF_PROVIDER`: `ollama` (default, `gemma4:e4b`),
  `anthropic` (needs `ANTHROPIC_API_KEY`), or `computed`.
- `generateBrief()`: start from `computeBrief()`, then ask the model (JSON-constrained)
  for `{ lede, highlights[≤3] }` from the tasks + notes. Keep `focus/due/overdue` from
  the computed brief. **Any failure → fall back to computed.**
- An eval (`ai/eval.ts`) asserting invariants (focus is a real task, due math correct,
  shape valid) — runs without an API key.

## Lane C — web (`src/views/Brief.tsx`)
- States: empty ("isn't written yet, Generate") → generating (cycle whimsical
  "thinking" words) → generated doc (greeting, focus card, highlights, due-soon) →
  history list (click to view any past brief in full).
- Dates are dynamic (real weekday/date, no hardcoding).

## Server
- `POST /api/briefs/generate` → `generateBrief()` + `saveBrief()`; `GET /api/briefs`.

## Done when
Clicking Generate produces an AI lede + highlights grounded in your tasks; with no
model available it still produces a correct computed brief; history reloads in full.
