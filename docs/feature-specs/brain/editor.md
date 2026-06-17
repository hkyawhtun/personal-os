# PRD — Brain: markdown editor + formatting toolbar

**Lesson 2 · slide 20.** The center column of the Brain surface.

## Why
Notes are markdown. Editing should be frictionless, with light formatting help.

## Behavior
- A large **title** input and a **body** editor.
- Toggle between **rendered** view (markdown) and **Edit** (raw textarea) via an
  Edit/Done button in the meta row.
- The meta row (above a divider) shows: "Edited <date>", the note's tags, and — while
  editing — a small **formatting toolbar**: `H` (insert `## `), `•` (insert `- `),
  `B` (wrap selection in `**bold**`), `[[ ]]` (wrap selection in a wiki-link). Buttons
  insert at the cursor and keep focus (mousedown-preventDefault so the selection isn't
  lost). Placeholder is just "Start writing…".
- Rendering supports `##`/`###` headings, `-` lists, `**bold**`, `` `code` ``,
  `>` quotes, and `[[wiki-links]]` (see `brain-wikilinks.md`).
- Edits update local state immediately; persistence is **debounced (~450ms)**.

## Implementation notes
- File: `src/views/Brain.tsx` (editor portion); renderer + helpers in `src/lib/markdown.tsx`
  (`renderInline`, `MarkdownBody`, `extractLinks`, `plainSnippet`).
- Insert helpers operate on the textarea selection (`wrap(before, after)`,
  `linePrefix(prefix)`), then restore the caret via `requestAnimationFrame`.

## Done when
Typing is smooth (no flashing), the toolbar inserts correct markdown at the cursor,
and Done renders it.
