# PRD — Brain: notes list, search, new note

**Lesson 2 · slide 20.** The left column of the Brain (Second Brain) surface.

## Why
A Second Brain is short, linked notes. The list is how you find and switch between them.

## Behavior
- Left column (the single left column on the Brain tab): a **search box**, a **New
  note** button, then the note list (newest-updated first).
- Each list item shows the **title**, a one-line plain-text **snippet** of the body,
  the **updated** date, and up to two **#tags**.
- **Search** filters by title, body, or tag (case-insensitive), live as you type.
- **New note** creates an "Untitled note", selects it, and drops into edit mode.
- Selecting an item opens it in the editor (right). The active item is highlighted.

## Data
- `core` notes table: `{ id, title, tags(JSON), body, updated }`.
- Functions: `listNotes(search?)`, `getNote(idOrTitle)`, `upsertNote()`, `deleteNote()`.
- API: `GET /api/notes?q=`, `GET /api/notes/:id`, `POST/PUT/DELETE /api/notes`.
- Seed a couple of system notes (e.g. "Second Brain", "Daily Brief").

## Implementation notes
- File: `src/views/Brain.tsx` (note-list portion); `plainSnippet()` from `src/lib/markdown.tsx`.
- Saves are **debounced** and persisted via the API; the app ignores its own
  (`source: user`) SSE echoes so typing never flashes.

## Done when
You can search, create, and switch between notes; the list reflects edits without
flashing while you type.
