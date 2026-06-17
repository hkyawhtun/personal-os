/* ============================================================
   Unit tests for the shared core (node:test, no deps).
   Run:  node --test db.test.ts        (from personal-os/core)
   Uses a throwaway DB so it never touches your real data.
   ============================================================ */
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point core at a throwaway DB before importing it.
process.env.POS_DB = join(mkdtempSync(join(tmpdir(), "pos-core-")), "test.db");

let core: typeof import("./db.ts");
before(async () => {
  core = await import("./db.ts");
});

function clearAll(): void {
  for (const t of core.listTasks()) core.deleteTask(t.id);
}
beforeEach(() => clearAll());

const TODAY = new Date("2026-06-03T12:00:00");
const iso = (d: Date): string => d.toISOString().slice(0, 10);

/* ---------- tasks ---------- */
test("addTask stores fields and listTasks returns it", () => {
  const t = core.addTask({ title: "Write tests", list: "work", due: iso(TODAY), priority: true });
  assert.ok(t.id);
  assert.equal(t.title, "Write tests");
  assert.equal(t.list, "work");
  assert.equal(t.done, false);
  assert.equal(t.priority, true);
  const all = core.listTasks();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, t.id);
});

test("addTask defaults to inbox + not done", () => {
  const t = core.addTask({ title: "Loose thought" });
  assert.equal(t.list, "inbox");
  assert.equal(t.done, false);
  assert.equal(t.due, null);
});

test("listTasks filters by list", () => {
  core.addTask({ title: "A", list: "work" });
  core.addTask({ title: "B", list: "personal" });
  assert.equal(core.listTasks("work").length, 1);
  assert.equal(core.listTasks("personal").length, 1);
  assert.equal(core.listTasks("all").length, 2);
});

test("toggleTask flips done both ways", () => {
  const t = core.addTask({ title: "Toggle me" });
  assert.equal(core.toggleTask(t.id)?.done, true);
  assert.equal(core.toggleTask(t.id)?.done, false);
});

test("setTaskDone sets explicitly; missing id returns null", () => {
  const t = core.addTask({ title: "x" });
  assert.equal(core.setTaskDone(t.id, true)?.done, true);
  assert.equal(core.toggleTask("nope"), null);
});

test("deleteTask removes and reports", () => {
  const t = core.addTask({ title: "bye" });
  assert.equal(core.deleteTask(t.id), true);
  assert.equal(core.deleteTask(t.id), false);
  assert.equal(core.listTasks().length, 0);
});

/* ---------- seed ---------- */
test("seedIfEmpty seeds once, then is a no-op", () => {
  assert.equal(core.listTasks().length, 0);
  assert.equal(core.seedIfEmpty(), true);
  assert.ok(core.listTasks().length > 0);
  assert.equal(core.seedIfEmpty(), false);
});
