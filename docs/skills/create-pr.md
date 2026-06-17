# Skill instructions — `/create-pr`

**Lesson 3 · slide 27 (live demo).** These are the *instructions* the instructor walks
through to turn this workflow into a skill live — do NOT pre-build the skill.

The skill packages our PR workflow for the Personal OS repo: review the diff, write a
formatted summary, capture visual proof with `/chrome`, open the PR with `gh`, and file
the summary into the **Second Brain** as a note.

## Steps to demonstrate (then "save that as a skill called /create-pr")

1. **Review the code** — run Claude's built-in `/review` on the current diff and fold
   the findings into the PR description (fix or note them).

2. **Write the diff summary** in this exact format:
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

3. **Capture visual proof** — use `/chrome` to run the app, navigate to the changed
   surface, and screenshot it; embed the image path(s) under **Screenshots**.

4. **Open the PR** — branch if on `main`, commit, push, and `gh pr create` with the
   summary as the body.

5. **File it in the Brain** — create a note titled "PR: <branch>" whose body is the
   summary, tagged `pr`, so the Second Brain keeps a searchable record of shipped work.

## Then
"Save that exact process as a reusable skill called `/create-pr`." Verify the generated
`.claude/skills/create-pr/SKILL.md`, then invoke `/create-pr` on a fresh change.
