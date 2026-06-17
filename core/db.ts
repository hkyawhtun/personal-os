/* ============================================================
   Personal OS — shared data + domain layer.
   Backed by the built-in node:sqlite (no native deps).
   Used by both the HTTP server and the `pos` CLI so they
   operate on the same database file.
   ============================================================ */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Task, NewTask, Chat, ChatMessage, ChangeEvent } from "./types.ts";

/** DB path: POS_DB env var, else <core>/../.data/pos.db */
export const DB_PATH = process.env.POS_DB || join(import.meta.dirname, "..", ".data", "pos.db");

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS tasks (
    id        TEXT PRIMARY KEY,
    list      TEXT NOT NULL DEFAULT 'inbox',
    title     TEXT NOT NULL,
    note      TEXT,
    due       TEXT,
    done      INTEGER NOT NULL DEFAULT 0,
    priority  INTEGER NOT NULL DEFAULT 0,
    created   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chats (
    id        TEXT PRIMARY KEY,
    title     TEXT NOT NULL DEFAULT 'New chat',
    created   TEXT NOT NULL,
    updated   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id        TEXT PRIMARY KEY,
    chat_id   TEXT NOT NULL,
    role      TEXT NOT NULL,
    content   TEXT NOT NULL,
    steps     TEXT,
    created   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created);
`);

/* ---------- row shapes ---------- */
interface TaskRow {
  id: string;
  list: string;
  title: string;
  note: string | null;
  due: string | null;
  done: number;
  priority: number;
  created: string;
}

/* ---------- helpers ---------- */
const nowIso = (): string => new Date().toISOString();
const rid = (p: string): string => p + Math.random().toString(36).slice(2, 9);

function taskOut(r: TaskRow): Task {
  return { id: r.id, list: r.list, title: r.title, note: r.note || undefined, due: r.due || null, done: !!r.done, priority: !!r.priority };
}

/* ---------- change events (powers live SSE updates) ----------
   In-process bus: any mutation (HTTP or agent tool) emits, the server's
   /api/events SSE handler forwards to connected browsers.
   `source` is "agent" when the change happened inside a withSource("agent")
   scope (the assistant loop) — AsyncLocalStorage keeps it across awaits. */
const sourceStore = new AsyncLocalStorage<ChangeEvent["source"]>();
export function withSource<T>(source: ChangeEvent["source"], fn: () => T): T {
  return sourceStore.run(source, fn);
}
const changeListeners = new Set<(e: ChangeEvent) => void>();
export function onChange(fn: (e: ChangeEvent) => void): () => void {
  changeListeners.add(fn);
  return () => { changeListeners.delete(fn); };
}
function emit(entity: ChangeEvent["entity"], action: ChangeEvent["action"], label?: string, id?: string): void {
  const source = sourceStore.getStore() ?? "user";
  for (const l of changeListeners) l({ entity, action, label, id, source });
}

/* ---------- tasks ---------- */
export function listTasks(list?: string): Task[] {
  const rows = (list && list !== "all"
    ? db.prepare("SELECT * FROM tasks WHERE list = ? ORDER BY done, created DESC").all(list)
    : db.prepare("SELECT * FROM tasks ORDER BY done, created DESC").all()) as unknown as TaskRow[];
  return rows.map(taskOut);
}
export function addTask({ title, list = "inbox", due = null, note = null, priority = false }: NewTask): Task {
  const row: TaskRow = { id: rid("t"), list, title, note, due, done: 0, priority: priority ? 1 : 0, created: nowIso() };
  db.prepare("INSERT INTO tasks (id,list,title,note,due,done,priority,created) VALUES (?,?,?,?,?,?,?,?)")
    .run(row.id, row.list, row.title, row.note, row.due, row.done, row.priority, row.created);
  emit("tasks", "created", title, row.id);
  return taskOut(row);
}
export function setTaskDone(id: string, done: boolean): Task | null {
  db.prepare("UPDATE tasks SET done = ? WHERE id = ?").run(done ? 1 : 0, id);
  const r = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as unknown as TaskRow | undefined;
  if (r) emit("tasks", done ? "completed" : "reopened", r.title, id);
  return r ? taskOut(r) : null;
}
export function toggleTask(id: string): Task | null {
  const r = db.prepare("SELECT done FROM tasks WHERE id = ?").get(id) as unknown as { done: number } | undefined;
  if (!r) return null;
  return setTaskDone(id, !r.done);
}
export function deleteTask(id: string): boolean {
  const r = db.prepare("SELECT title FROM tasks WHERE id = ?").get(id) as unknown as { title: string } | undefined;
  const ok = db.prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;
  if (ok) emit("tasks", "deleted", r?.title, id);
  return ok;
}

/* ---------- seed (only if empty) ---------- */
export function seedIfEmpty(): boolean {
  const count = (db.prepare("SELECT COUNT(*) AS n FROM tasks").get() as unknown as { n: number }).n;
  if (count > 0) return false;
  const created = nowIso();
  const seedTasks: TaskRow[] = [
    { id: "t1", list: "work", title: "Finish Q2 board deck — revenue + retention slides", note: "Pull the cohort chart from the data room", due: "2026-06-03", done: 0, priority: 1, created },
    { id: "t2", list: "work", title: "Review Priya's PR on the auth refactor", note: null, due: "2026-06-03", done: 0, priority: 0, created },
    { id: "t6", list: "personal", title: "Book the dentist (overdue, do it)", note: null, due: "2026-06-01", done: 0, priority: 0, created },
    { id: "t8", list: "personal", title: "Call Mom back", note: null, due: "2026-06-03", done: 0, priority: 0, created },
    { id: "t10", list: "inbox", title: "Look into the standing-desk recommendation from Sam", note: null, due: null, done: 0, priority: 0, created },
    { id: "t12", list: "someday", title: "Learn enough Rust to be dangerous", note: null, due: null, done: 0, priority: 0, created },
  ];
  const ins = db.prepare("INSERT INTO tasks (id,list,title,note,due,done,priority,created) VALUES (?,?,?,?,?,?,?,?)");
  for (const t of seedTasks) ins.run(t.id, t.list, t.title, t.note, t.due, t.done, t.priority, t.created);
  return true;
}

/* ---------- chats (assistant threads) ---------- */
interface ChatRow { id: string; title: string; created: string; updated: string; }
interface MessageRow { id: string; chat_id: string; role: string; content: string; steps: string | null; created: string; }

export function listChats(): Chat[] {
  return db.prepare("SELECT * FROM chats ORDER BY updated DESC").all() as unknown as ChatRow[];
}
export function createChat(title = "New chat"): Chat {
  const now = nowIso();
  const row: ChatRow = { id: rid("c"), title, created: now, updated: now };
  db.prepare("INSERT INTO chats (id,title,created,updated) VALUES (?,?,?,?)").run(row.id, row.title, row.created, row.updated);
  return row;
}
export function getChat(id: string): Chat | null {
  const r = db.prepare("SELECT * FROM chats WHERE id = ?").get(id) as unknown as ChatRow | undefined;
  return r ?? null;
}
export function renameChat(id: string, title: string): void {
  db.prepare("UPDATE chats SET title = ? WHERE id = ?").run(title, id);
}
export function deleteChat(id: string): boolean {
  db.prepare("DELETE FROM messages WHERE chat_id = ?").run(id);
  return db.prepare("DELETE FROM chats WHERE id = ?").run(id).changes > 0;
}
export function listMessages(chatId: string): ChatMessage[] {
  const rows = db.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created").all(chatId) as unknown as MessageRow[];
  return rows.map((r) => ({
    id: r.id,
    chatId: r.chat_id,
    role: r.role as ChatMessage["role"],
    content: r.content,
    steps: r.steps ? (JSON.parse(r.steps) as ChatMessage["steps"]) : undefined,
    created: r.created,
  }));
}
export function addMessage(chatId: string, m: { role: "user" | "assistant"; content: string; steps?: unknown }): ChatMessage {
  const created = nowIso();
  const id = rid("m");
  db.prepare("INSERT INTO messages (id,chat_id,role,content,steps,created) VALUES (?,?,?,?,?,?)")
    .run(id, chatId, m.role, m.content, m.steps ? JSON.stringify(m.steps) : null, created);
  db.prepare("UPDATE chats SET updated = ? WHERE id = ?").run(created, chatId);
  emit("chats", "updated", undefined, chatId);
  // title the thread from its first user message
  if (m.role === "user") {
    const chat = getChat(chatId);
    if (chat && chat.title === "New chat") {
      renameChat(chatId, m.content.slice(0, 48) + (m.content.length > 48 ? "…" : ""));
    }
  }
  return { id, chatId, role: m.role, content: m.content, steps: m.steps as ChatMessage["steps"], created };
}

export default db;
