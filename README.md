# Personal OS

A calm, single-user personal command center — the **spine project** for the
Build with Claude Code course (V2). One webapp, three surfaces:

- **Brief** — an AI-style daily digest computed from your tasks + notes (what's
  due, what slipped, the one thing to focus on). Empty → generating → generated.
- **Tasks** — a todo list grouped by Overdue / Today / Upcoming, with lists,
  quick-add (try "Email Sam tomorrow"), and completion.
- **Brain** — a Second Brain of markdown notes with `[[wiki-links]]`, live
  backlinks, and search.

Light/dark theming, collapsible nav rail, and a collapsible connections panel.

## Stack

**Everything is TypeScript.** The web is bundled by Vite; `core/`, `server/`,
`cli/`, and `ai/` run as **native TypeScript on Node 25+** (type stripping — no
build step). `tsc --noEmit` is the typecheck safety net.

- **Web** — React 18 + Vite + TypeScript (this directory). Hydrates from the API,
  falls back to seed data offline.
- **core/** — shared data + domain layer on the built-in `node:sqlite` (no native
  deps). Owns the schema, CRUD, and the deterministic `computeBrief` fallback.
- **server/** — Express HTTP API over `core/` (`/api/tasks`, `/api/notes`,
  `/api/briefs`).
- **cli/** — `pos`, a terminal client that drives the same DB directly so Claude
  Code (and cron) can operate the app without the server running.
- **ai/** — model-written brief (local Ollama by default; Anthropic optional) with
  a graceful fallback.
- **agent/** — the owned agent loop + plugin tools (one per app action), driven by Ollama.

## Logging

The server uses **Pino** (`server/src/logger.ts`) — import `logger` instead of
`console.log`. In dev it prints human-readable lines via `pino-pretty`; in prod
it emits JSON (pipe to `jq`/`lnav`). `pino-http` logs every request
(method · url · status · responseTime, level by status). The agent loop's steps
are logged via the loop's `onStep` seam. Configure with env:

```bash
LOG_LEVEL=debug   # trace|debug|info|warn|error|fatal (default: debug dev / info prod)
NODE_ENV=development
```

## Run (requires Node ≥ 25)

```bash
# web
npm install && npm run dev                 # http://localhost:5173

# api (runs the .ts entry directly)
cd server && npm install && npm run dev    # http://localhost:4000

# cli (no install — uses node:sqlite + the shared core)
node cli/bin/pos.ts brief
node cli/bin/pos.ts add "Write the L4 demo" --list work --due tomorrow
node cli/bin/pos.ts ls --list work
```

## Test & typecheck

```bash
npm run test:all         # everything: node typecheck + node tests + web build + web tests
```

Or individually:

```bash
npm run typecheck:node   # core/server/cli/ai/agent: tsc -p tsconfig.node.json (erasable-syntax-only)
npm run test:node        # node:test suites: core (13) + agent tools (7) + agent loop (3) + brief fallback (2)
npm run build            # web: tsc --noEmit + vite build
npm test                 # web Vitest: lib (17) + view component tests — Tasks/Brain/Brief (14)
cd ai && node eval.ts    # brief invariant evals (no API key needed)
```

**56 tests** cover the data layer, the agent tools + loop (mocked model), the
brief fallback, and every interactive view control (add/complete/delete tasks,
note tag add/remove, wiki-link nav, search, brief generate + history).

## Layout

```
src/
├── main.tsx            # entry
├── App.tsx             # shell: nav rail, topbar, theme, routing
├── styles.css          # design tokens + component styles (from the design handoff)
├── types.ts            # Task / Note / List / Brief types
├── data.ts             # seed tasks, notes, lists, brief history
├── lib/
│   ├── dates.ts        # due-date math (relative to a fixed "today")
│   └── markdown.tsx    # minimal markdown + [[wiki-link]] renderer
├── components/
│   ├── icons.tsx       # stroke icon set
│   └── ui.tsx          # Button, IconButton, TagChip
└── views/
    ├── Tasks.tsx
    ├── Brain.tsx
    └── Brief.tsx
```

## Provenance

Implemented from a Claude Design handoff bundle
(`../designs/personal-os-design/`). The in-browser Babel prototype there was
converted into this typed Vite app; visuals and tokens match the source.
