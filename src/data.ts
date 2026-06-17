/* ============================================================
   SEED DATA — realistic placeholder content.
   TODAY is the real current date (midnight) for due-date math.
   ============================================================ */
import type { List, Task, Note } from "./types";

const _now = new Date();
export const TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());

export const SEED_LISTS: List[] = [
  { id: "inbox", name: "Inbox", color: "oklch(0.6 0.02 250)" },
  { id: "work", name: "Work", color: "oklch(0.55 0.13 250)" },
  { id: "personal", name: "Personal", color: "oklch(0.6 0.13 155)" },
  { id: "someday", name: "Someday", color: "oklch(0.62 0.13 300)" },
];

export const SEED_TASKS: Task[] = [
  { id: "t1", list: "work", title: "Finish Q2 board deck — revenue + retention slides", note: "Pull the cohort chart from the data room", due: "2026-06-03", done: false, priority: true },
  { id: "t2", list: "work", title: "Review Priya's PR on the auth refactor", due: "2026-06-03", done: false },
  { id: "t3", list: "work", title: "Reply to the design-system RFC thread", due: "2026-06-04", done: false },
  { id: "t4", list: "work", title: "Draft the hiring loop for the staff eng role", due: "2026-06-06", done: false },
  { id: "t5", list: "work", title: "Send recap notes from the partner sync", done: true },
  { id: "t6", list: "personal", title: "Book the dentist (overdue, do it)", due: "2026-06-01", done: false },
  { id: "t7", list: "personal", title: "Plan weekend hike — check the Ridgeline trail", due: "2026-06-06", done: false },
  { id: "t8", list: "personal", title: "Call Mom back", due: "2026-06-03", done: false },
  { id: "t9", list: "personal", title: "Renew the library books", done: true },
  { id: "t10", list: "inbox", title: "Look into the standing-desk recommendation from Sam", done: false },
  { id: "t11", list: "inbox", title: "That article on spaced repetition — read it", done: false },
  { id: "t12", list: "someday", title: "Learn enough Rust to be dangerous", done: false },
  { id: "t13", list: "someday", title: "Repaint the back fence", done: false },
  { id: "t14", list: "work", title: "Inbox zero before EOD", due: "2026-06-03", done: false },
];

/* --- Brain notes. Bodies use markdown + [[wiki-links]] --- */
export const SEED_NOTES: Note[] = [
  {
    id: "n-personal-os",
    title: "Personal OS",
    tags: ["system", "meta"],
    updated: "2026-06-02",
    body: `The whole point: one calm place that holds what I'm doing ([[Tasks]]), what I know ([[Second Brain]]), and tells me what matters each morning ([[Daily Brief]]).

## Principles
- **Capture beats organizing.** Get it in fast, sort later.
- **One accent, lots of air.** Calm over clever.
- **The Brief does the thinking** so I don't re-derive my priorities every morning.

See also [[Weekly Review]] — the ritual that keeps this honest.`,
  },
  {
    id: "n-second-brain",
    title: "Second Brain",
    tags: ["system", "notes"],
    updated: "2026-05-30",
    body: `A Second Brain is just notes that link to each other. The value isn't the note — it's the **connections**.

## How I use it
- Short notes, one idea each.
- Link generously with [[wiki-links]]. Backlinks surface the web later.
- Tag sparingly — links do most of the work.

This pairs with [[Deep Work]]: capture during the day, connect during [[Weekly Review]].`,
  },
  {
    id: "n-daily-brief",
    title: "Daily Brief",
    tags: ["system", "ritual"],
    updated: "2026-06-03",
    body: `Every morning the [[Personal OS]] reads [[Tasks]] and the [[Second Brain]] and writes me a short report: what's due, what to focus on, what's drifting.

## Why it works
It removes the 10-minute "what should I even do today" tax. I open it, I trust it, I start.

> The best system is the one that tells you the next action without being asked.

Keep it short. If the brief is longer than a screen, it's failing.`,
  },
  {
    id: "n-deep-work",
    title: "Deep Work",
    tags: ["focus", "habits"],
    updated: "2026-05-28",
    body: `Long, uninterrupted blocks on one hard thing. Protect the morning for it.

- Phone in another room.
- One tab, one task.
- 90 minutes, then a real break.

Feeds directly into [[Tasks]] — the **priority** task each day should be deep work, not shallow busywork. The [[Daily Brief]] picks it for me.`,
  },
  {
    id: "n-weekly-review",
    title: "Weekly Review",
    tags: ["ritual", "system"],
    updated: "2026-05-31",
    body: `Sunday evening, 20 minutes. The maintenance pass that keeps the [[Personal OS]] trustworthy.

## Checklist
- Clear the **Inbox** list in [[Tasks]].
- Process loose notes in the [[Second Brain]], add links.
- Skim the week's [[Daily Brief]] history — did I follow them?
- Pick the one thing that matters next week.`,
  },
  {
    id: "n-tasks",
    title: "Tasks",
    tags: ["system"],
    updated: "2026-05-25",
    body: `Lists, not folders. Inbox is the catch-all; everything else is a context (Work, Personal, Someday).

A task is good when it names a **next physical action**. "Plan trip" is a project; "Check the Ridgeline trail conditions" is a task.

Surfaced and prioritized by the [[Daily Brief]].`,
  },
  {
    id: "n-reading",
    title: "Reading List",
    tags: ["queue"],
    updated: "2026-06-01",
    body: `Things to read, not yet processed into the [[Second Brain]].

- *Spaced repetition* — how memory scheduling actually works.
- The standing-desk ergonomics piece Sam sent.
- A long essay on [[Deep Work]] and attention residue.`,
  },
];
