/* ============================================================
   Tool registry — the plugin layer.
   Every app action is a tool: { name, description, parameters (JSON
   schema), execute(args) }. The agent loop (loop.ts) hands these to
   the model and runs whichever it calls. Inspired by opencode's
   define()/Tool shape, but we own the loop (see loop.ts).
   ============================================================ */
import {
  addTask, listTasks, setTaskDone, deleteTask,
} from "../core/db.ts";
import type { Task } from "../core/types.ts";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema
  execute(args: Record<string, unknown>): Promise<string>;
}

/* ---- helpers ---- */
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
function resolveDue(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date();
  if (/^today$/i.test(s)) return d.toISOString().slice(0, 10);
  if (/^tomorrow$/i.test(s)) { d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
  return s; // assume YYYY-MM-DD
}
const STOP = new Set(["the", "a", "an", "to", "my", "me", "task", "about", "for", "of", "is", "on", "and"]);
function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
/**
 * Resolve a task by id, exact/substring title, else best token overlap.
 * Token overlap lets fuzzy refs match — e.g. "calling Mom" → "Call Mom back".
 */
function findTask(args: Record<string, unknown>): Task | null {
  const key = str(args.id) || str(args.title);
  if (!key) return null;
  const tasks = listTasks();
  const byId = tasks.find((t) => t.id === key);
  if (byId) return byId;
  const k = key.toLowerCase();
  const bySub = tasks.find((t) => t.title.toLowerCase().includes(k) || k.includes(t.title.toLowerCase()));
  if (bySub) return bySub;
  // best token-overlap match
  const want = new Set(tokens(key));
  if (want.size === 0) return null;
  let best: Task | null = null;
  let bestScore = 0;
  for (const t of tasks) {
    const score = tokens(t.title).filter((w) => want.has(w)).length;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return bestScore > 0 ? best : null;
}
function taskLine(t: Task): string {
  return `${t.id} · ${t.title}${t.priority ? " ★" : ""} · ${t.list}${t.due ? ` · due ${t.due}` : ""}${t.done ? " · done" : ""}`;
}

export const tools: Tool[] = [
  {
    name: "list_tasks",
    description:
      "List the user's open tasks (optionally filtered to one list: inbox, work, personal, someday). This is the source of truth for tasks — USE THIS to answer 'what do I have to do', 'what's on my plate', 'my tasks', 'anything due', etc., and to find a task's id before completing or deleting it.",
    parameters: { type: "object", properties: { list: { type: "string", description: "optional list name" } } },
    execute: async (a) => {
      const tasks = listTasks(str(a.list) || "all").filter((t) => !t.done);
      return tasks.length ? tasks.map(taskLine).join("\n") : "(no open tasks)";
    },
  },
  {
    name: "add_task",
    description: "Create a new task.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        list: { type: "string", description: "inbox | work | personal | someday" },
        due: { type: "string", description: "today, tomorrow, or YYYY-MM-DD" },
        priority: { type: "boolean" },
      },
      required: ["title"],
    },
    execute: async (a) => {
      const title = str(a.title);
      if (!title) return "error: title is required";
      const t = addTask({ title, list: str(a.list) || "inbox", due: resolveDue(a.due), priority: a.priority === true });
      return `added ${taskLine(t)}`;
    },
  },
  {
    name: "complete_task",
    description: "Mark a task done, by id or by title.",
    parameters: { type: "object", properties: { id: { type: "string" }, title: { type: "string" } } },
    execute: async (a) => {
      const t = findTask(a);
      if (!t) return "error: no matching task";
      setTaskDone(t.id, true);
      return `completed ${t.title}`;
    },
  },
  {
    name: "delete_task",
    description: "Delete a task, by id or by title.",
    parameters: { type: "object", properties: { id: { type: "string" }, title: { type: "string" } } },
    execute: async (a) => {
      const t = findTask(a);
      if (!t) return "error: no matching task";
      deleteTask(t.id);
      return `deleted ${t.title}`;
    },
  },
  {
    name: "reopen_task",
    description: "Mark a completed task as not done again, by id or title.",
    parameters: { type: "object", properties: { id: { type: "string" }, title: { type: "string" } } },
    execute: async (a) => {
      const t = findTask(a);
      if (!t) return "error: no matching task";
      setTaskDone(t.id, false);
      return `reopened ${t.title}`;
    },
  },
];

export const toolsByName = new Map(tools.map((t) => [t.name, t]));
