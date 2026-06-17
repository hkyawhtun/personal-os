# Personal OS — build docs

These docs drive the **course demos**. Each lesson builds a feature of Personal OS
by pointing Claude Code at the relevant PRD/SPEC and recreating it.

```
docs/
├── prd/                      # product specs for UI features (recreate exactly)
│   ├── floating-assistant.md     # L1, slide 11 — the Chat FAB
│   ├── brain-notes.md            # L2, slide 20 — note list + search + new note
│   ├── brain-editor.md           # L2, slide 20 — markdown editor + formatting toolbar
│   ├── brain-wikilinks.md        # L2, slide 20 — [[wiki-links]] + navigation
│   ├── brain-backlinks.md        # L2, slide 20 — Connections panel
│   └── brain-tags.md             # L2, slide 20 — tag add/remove
├── spec/                     # engineering specs for parallel-team builds
│   ├── ai-brief.md               # L5 — the AI Brief feature
│   └── rss-feeds.md              # L5 — RSS subscriptions
├── skills/
│   └── create-pr.md              # L3, slide 27 — create-pr skill instructions
└── pillars-map.md            # L6, slide 51 — what we built ↔ the five pillars
```

Conventions every feature follows (see also `../CLAUDE.md`):
- **One surface per view** in `src/views/`, controlled by props from `App.tsx`.
- Mutations are **optimistic locally + persisted via the API**; the server emits a
  change event; SSE pushes it to the browser.
- Tokens/styles come from `src/styles.css` design variables — never hard-code colors.
- Each feature ships a test (`*.test.tsx` Vitest for web, `node --test` for core/agent).
