# PRD — Brain: tags

**Lesson 2 · slide 20.** Lightweight tagging for notes.

## Why
Tags add a second axis of organization (links do most of the work; tags help filter).

## Behavior
- The editor meta row shows the note's tags as removable chips (click a chip → remove).
- A dashed **"+ tag"** control opens a small inline input; type a tag + `Enter` to add.
  `Escape` or blur closes it. Empty/duplicate tags are ignored.
- Tags participate in note **search** (see `brain-notes.md`) and show in the note list.

## Implementation notes
- File: `src/views/Brain.tsx` — `addTag`/`removeTag` call `onSaveNote` with the updated
  `tags` array (persisted via the debounced save). `.tag-input` style in `styles.css`.

## Done when
You can add a tag via the inline input and remove one by clicking it; tags persist and
are searchable.
