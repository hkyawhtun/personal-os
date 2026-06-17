# CLAUDE.md — Personal OS

A calm, single-user command center. One app, three surfaces + an agent:
**Tasks**, **Brain** (Second Brain notes), **Brief** (AI daily digest), and an
**Assistant** (chat + floating bubble) that can operate the app.

## Stack
- **Web:** React 18 + Vite + TypeScript (`src/`). State lives in `App.tsx`; views are
  presentational and controlled by props.
- **core/** — shared data + domain layer on the built-in `node:sqlite` (no native deps).
  Owns the schema, all CRUD, the deterministic `computeBrief`, and the change-event bus.
- **server/** — Express API over `core/` (+ SSE at `/api/events`, pino logging).
- **agent/** — the owned agent loop + a tool registry (one tool per app action), backed
  by a local Ollama model.
- **ai/** — brief generator (Ollama, with a graceful computed fallback) + RSS reader.
- **cli/** — `pos`, a terminal client over the same `core/` so Claude/cron can drive it.

Everything is TypeScript; `core/server/cli/ai/agent` run as **native TS on Node ≥25**
(type stripping, no build). `tsc --noEmit` is the typecheck gate.

## The "surface" pattern
Each feature is one view in `src/views/` with typed props. App owns shared state and
passes data + callbacks down. Add a feature → add a view + (if persisted) a `core`
function + a server endpoint + (optionally) an agent tool.

## Conventions
- Mutations are **optimistic locally**, then persisted via the API; the server emits a
  change event; SSE pushes it to the browser. The app **ignores its own
  (`source: "user"`) SSE echoes** and only reacts to `source: "agent"` changes.
- Never hard-code colors/spacing — use the design tokens in `src/styles.css`.
- The brief keeps **facts computed** (focus/due/overdue); the model only writes prose.
- Every feature ships a test (Vitest for web, `node --test` for core/agent/ai).

## Run
```bash
npm install && npm run dev                 # web :5173
cd server && npm install && npm run dev    # api  :4000
node cli/bin/pos.ts brief                  # CLI
npm run test:all                           # typecheck + node tests + build + web tests
```

## Where things live
- Feature specs the demos build from: `docs/` (PRDs in `docs/feature-specs/`, SPECs in `docs/feature-specs/`).
- Agent tools: `agent/tools.ts`. Agent loop: `agent/loop.ts`.
- Live updates / change bus: `core/db.ts` (`onChange`, `emit`, `withSource`).
