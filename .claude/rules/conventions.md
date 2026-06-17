# Path rules — Personal OS

Applies to this project. Keep changes consistent with these.

## Web (`src/`)
- Views in `src/views/` are presentational + controlled by props from `App.tsx`. Don't
  fetch or hold cross-feature state inside a view; lift it to `App`.
- Use design tokens from `src/styles.css` (`var(--accent)`, `var(--space-*)`, etc.).
  Never hard-code hex colors or pixel spacing in components.
- New icons come from `src/components/icons.tsx` (Lucide wrappers), not inline SVG.
- Persisted mutations: update local state immediately, then call the `api` client;
  debounce high-frequency saves (e.g. note typing ~450ms).

## Node (`core/`, `server/`, `agent/`, `ai/`, `cli/`)
- Native TypeScript (Node ≥25) — **erasable syntax only** (no enums/namespaces/param
  properties); use `import type` for type-only imports. `tsc -p tsconfig.node.json`
  must pass.
- All DB access goes through `core/db.ts`; don't open SQLite elsewhere.
- Mutations call `emit(entity, action, label?, id?)`; agent-initiated work runs inside
  `withSource("agent", …)` so the UI can distinguish agent vs user changes.

## Tests
- Add a test with each feature. Web: Vitest (`*.test.tsx`). Node: `node --test`
  (`*.test.ts`). `npm run test:all` is the full gate.
