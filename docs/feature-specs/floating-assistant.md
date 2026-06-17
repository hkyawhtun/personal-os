# PRD — Floating Assistant (Chat FAB)

**Lesson 1 · slide 11 (Plan mode).** Recreate the always-available assistant bubble.

## Why
The full **Assistant** tab is great, but you shouldn't have to leave Tasks to ask the
agent to do something. A persistent floating button lets you drive the app from any
tab — and watch the change happen.

## Behavior
- A circular **FAB** fixed at bottom-right, on **every tab except the full Assistant
  view**. Chat icon when closed, X when open.
- Clicking opens a **windowed chat panel** (≈380×540, bottom-right) with: a header
  ("Assistant" + close), a scrollable message list, and an input with a send button.
- Empty state: a one-line hint ("Ask me to add a task, search notes, or generate your
  brief — you'll see it happen here.").
- Sending a message calls the agent loop (`POST /api/agent` via `api.agent(goal)`),
  appends the user message immediately, shows a **"Working…"** indicator while the
  agent runs, then renders the assistant reply.
- The assistant message shows **which tools ran** as small chips (e.g. `add_task`).
- **After any tool runs, refresh app state** so the change is visible in the current
  tab (e.g. a new task appears in the Tasks list). Pass an `onChange` callback from
  `App` that re-pulls tasks/notes/briefs.
- Offline-aware: if the API is unreachable, show "the assistant needs the API server
  running" instead of failing silently.
- `Enter` sends, `Shift+Enter` newline.

## Implementation notes
- File: `src/views/FloatingAssistant.tsx`; rendered in `App.tsx` when `view !== "chat"`.
- Reuses `api.agent`, the `Icon` set, and the `.msg`/`.msg-bubble`/`.msg-step-chip`
  chat styles. Add `.fab` / `.fab-panel` styles in `src/styles.css`.
- Live updates already flow through SSE; `onChange` is a belt-and-suspenders refresh.

## Done when
Open Tasks → click the bubble → "add a task to call the dentist tomorrow" → the panel
shows the `add_task` chip + a confirmation, and the task appears in the Tasks list
(with a flash + toast).
