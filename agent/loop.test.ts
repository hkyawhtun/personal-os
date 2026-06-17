/* Unit test for the owned agent loop (node:test), with a stubbed Ollama.
   Run: node --test loop.test.ts   (from personal-os/agent) */
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.POS_DB = join(mkdtempSync(join(tmpdir(), "pos-loop-")), "t.db");

let core: typeof import("../core/db.ts");
let runAgent: typeof import("./loop.ts").runAgent;

before(async () => {
  core = await import("../core/db.ts");
  ({ runAgent } = await import("./loop.ts"));
});
beforeEach(() => {
  for (const t of core.listTasks()) core.deleteTask(t.id);
});

/** Queue canned Ollama /api/chat responses; the loop calls fetch once per turn. */
function stubOllama(responses: unknown[]) {
  let i = 0;
  globalThis.fetch = (async () => {
    const body = responses[Math.min(i++, responses.length - 1)];
    return { ok: true, json: async () => body, text: async () => "" };
  }) as unknown as typeof fetch;
}

test("loop runs a tool call, then returns the model's final answer", async () => {
  stubOllama([
    { message: { role: "assistant", content: "", tool_calls: [{ function: { name: "add_task", arguments: { title: "from agent", list: "work" } } }] } },
    { message: { role: "assistant", content: "All done." } },
  ]);

  const result = await runAgent("add a task to work");

  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].tool, "add_task");
  assert.match(result.final, /All done/);
  assert.ok(core.listTasks().some((t) => t.title === "from agent" && t.list === "work"));
});

test("loop handles an unknown tool without throwing", async () => {
  stubOllama([
    { message: { role: "assistant", content: "", tool_calls: [{ function: { name: "no_such_tool", arguments: {} } }] } },
    { message: { role: "assistant", content: "Could not do that." } },
  ]);
  const result = await runAgent("do something impossible");
  assert.match(result.steps[0].output, /unknown tool/);
  assert.match(result.final, /Could not/);
});

test("loop stops at maxSteps if the model never finishes", async () => {
  // always returns a tool call → would loop forever without the cap
  stubOllama([{ message: { role: "assistant", content: "", tool_calls: [{ function: { name: "list_tasks", arguments: {} } }] } }]);
  const result = await runAgent("loop forever", { maxSteps: 3 });
  assert.equal(result.steps.length, 3);
  assert.match(result.final, /max steps/);
});
