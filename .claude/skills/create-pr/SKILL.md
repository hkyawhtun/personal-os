---
name: create-pr
description: Open a pull request for the current branch the Personal OS way — review the diff, write a formatted summary, capture a /chrome screenshot, push with gh, and file the summary as a Brain note.
---

# /create-pr

Package the Personal OS PR workflow into one command. Run these steps in order for
the current branch.

## 1. Review the code
Run the built-in `/review` on the current diff. Fix anything blocking; fold the rest
into the PR description as known notes.

## 2. Write the diff summary
Use exactly this format:

```
## What & why
<1-3 sentences>

## Changes
- <area>: <what changed>

## Test plan
- [ ] <how to verify>

## Screenshots
<chrome capture(s)>
```

## 3. Capture visual proof
Use `/chrome` to run the app (`npm run dev`), navigate to the surface this change
touches, and screenshot it. Embed the image path(s) under **Screenshots**. If the
change has no visible UI, note that instead.

## 4. Open the PR
If on `main`, create a branch first. Commit the work, push the branch, then
`gh pr create` with the summary from step 2 as the body. Only push to the
established origin.

## 5. File it in the Brain
Create a Brain note titled `PR: <branch>` whose body is the summary, tagged `pr`,
so the Second Brain keeps a searchable record of shipped work. Use the note agent
tool (or `pos note`, once the CLI exists).

## Notes
- This skill composes other capabilities (`/review`, `/chrome`, `gh`, the Brain) —
  it's the composability example from Lesson 3.
- Keep the summary short; the Test plan should be runnable by a reviewer.
