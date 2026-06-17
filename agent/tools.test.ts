/* Unit tests for the agent tool registry (node:test).
   Run: node --test tools.test.ts   (from personal-os/agent) */
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.POS_DB = join(mkdtempSync(join(tmpdir(), "pos-tools-")), "t.db");

let core: typeof import("../core/db.ts");
let toolsMod: typeof import("./tools.ts");
const run = (name: string, args: Record<string, unknown> = {}): Promise<string> => {
  const tool = toolsMod.toolsByName.get(name);
  if (!tool) throw new Error(`no tool ${name}`);
  return tool.execute(args);
};

before(async () => {
  core = await import("../core/db.ts");
  toolsMod = await import("./tools.ts");
});
beforeEach(() => {
  for (const t of core.listTasks()) core.deleteTask(t.id);
});

test("add_task + list_tasks", async () => {
  const added = await run("add_task", { title: "Ship it", list: "work", priority: true });
  assert.match(added, /added .* Ship it/);
  assert.match(await run("list_tasks", { list: "work" }), /Ship it/);
});

test("complete_task resolves a fuzzy title, reopen_task undoes it", async () => {
  core.addTask({ title: "Call Mom back", list: "personal" });
  assert.match(await run("complete_task", { title: "calling Mom" }), /completed Call Mom back/);
  assert.equal(core.listTasks().find((t) => t.title === "Call Mom back")?.done, true);
  assert.match(await run("reopen_task", { title: "Call Mom" }), /reopened/);
  assert.equal(core.listTasks().find((t) => t.title === "Call Mom back")?.done, false);
});

test("delete_task removes the task", async () => {
  const t = core.addTask({ title: "Temp task" });
  assert.match(await run("delete_task", { id: t.id }), /deleted Temp task/);
  assert.equal(core.listTasks().length, 0);
});

test("complete_task with no match reports cleanly (no hallucination)", async () => {
  assert.match(await run("complete_task", { title: "nonexistent" }), /no matching task/);
});
