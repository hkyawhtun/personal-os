# Personal OS ↔ the Five Pillars

**Lesson 6 · slide 51.** What we built across the course, mapped to each pillar.

## 1. Context Engineering — *right info at the right time*
- `CLAUDE.md` + `.claude/rules/` defining the stack, the "surface" pattern, conventions.
- The **Brain** (Second Brain): linked notes the agent reads as project memory.
- PRDs/SPECs in `docs/` that Claude reads to recreate features exactly.

## 2. Agentic Validation — *agents verify their own work*
- Tests at every layer (Vitest web + `node --test` core/agent/ai; `test:all`).
- `/chrome` validation demos (screenshot + add-a-task-and-verify; logo-fix verified visually).
- The brief's **eval suite** (invariants hold regardless of model).
- The brief keeps facts **computed** so the model can't hallucinate the schedule.

## 3. Agentic Tooling — *remove every manual step*
- The **agent loop + tool registry** (one tool per app action) — we own the loop.
- The **`pos` CLI** so Claude/cron can drive the app headlessly.
- The **Chat tab + Floating Assistant** as in-app agent surfaces.
- `/loop` · `/schedule` to run the brief unattended; MCP-ready tool registry.

## 4. Agentic Codebase — *code optimized for AI*
- Strict TypeScript end-to-end (web + native-TS node), `tsc --noEmit` gates.
- A shared `core/` layer behind one module; small, typed, documented surfaces.
- Clean per-feature diffs (the checkpoint tags) — easy for an agent to read.

## 5. Compound Engineering — *everything shared, everything compounds*
- The **tool registry** powers the CLI, the Chat tab, the FAB, and (next) MCP — build
  once, reuse everywhere.
- Skills (`/create-pr`) capture team workflows; PRDs/SPECs make features reproducible.
- SSE change-bus + `withSource` let every surface react to every other surface live.

**North star:** how long can Claude run on Personal OS before it needs you?
