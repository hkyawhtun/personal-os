# PRD — Brain: [[wiki-links]] + navigation

**Lesson 2 · slide 20.** Links between notes — the heart of a Second Brain.

## Why
The value of a Second Brain is the connections, not the notes. `[[wiki-links]]` make
linking effortless and navigable.

## Behavior
- In rendered note bodies, `[[Note Title]]` renders as a clickable link.
- Clicking a wiki-link **navigates** to the note whose title matches (case-insensitive);
  if no note matches, render it as a **"missing"** link (dashed/faint) so you can see
  unresolved references.
- Matching is by title; selecting sets the active note and exits edit mode.

## Implementation notes
- File: `src/lib/markdown.tsx` — `renderInline(text, onLink, noteTitles)` parses
  `[[...]]`, `**bold**`, `` `code` `` into React nodes; pass a `Set` of lowercased note
  titles so unknown links get the `.wikilink.missing` class.
- `Brain.tsx` builds the title set with `useMemo` and passes a `navigateTo(name)` handler.
- `extractLinks(body)` pulls all `[[...]]` targets (also used by backlinks).

## Done when
Clicking `[[Second Brain]]` in one note opens that note; a link to a non-existent note
renders as "missing".
