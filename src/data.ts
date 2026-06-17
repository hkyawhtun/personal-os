/* ============================================================
   SEED DATA — realistic placeholder content.
   TODAY is the real current date (midnight) for due-date math.
   ============================================================ */
import type { List, Task } from "./types";

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
