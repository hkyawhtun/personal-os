# PRD — Brain: Connections panel (backlinks + outgoing)

**Lesson 2 · slide 20.** The right column of the Brain surface.

## Why
Backlinks reveal the web around a note — "what else mentions this?" — which is where a
Second Brain earns its keep.

## Behavior
- A toggleable **Connections** panel (right column) for the active note.
- **Backlinks:** every other note whose body links to the active note's title, shown as
  cards (title + snippet). Clicking a card opens that note.
- **Linked from this note:** the distinct outgoing `[[links]]` in the active note,
  shown as chips; clicking a chip navigates to that note.
- A toggle in the top-nav (panel icon) shows/hides the panel.

## Implementation notes
- File: `src/views/Brain.tsx` (`BrainContext` component).
- `backlinks(title)` in `core/db.ts` scans notes for `[[title]]`; on the web, compute
  from loaded notes via `extractLinks`. `GET /api/notes/:id` also returns backlinks.
- Layout: `.brain-layout` is a 3-column grid `280px minmax(0,1fr) auto` (list · editor ·
  connections); the trailing `auto` collapses when the panel is hidden.

## Done when
Opening a note shows the notes that link to it and the notes it links to; both are
clickable; the panel toggles.
