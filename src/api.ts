/* ============================================================
   API client for the Personal OS backend.
   Base URL from VITE_API_URL, default http://localhost:4000.
   If the server is unreachable, the app falls back to seed data
   (see App.tsx) so it still runs standalone for design demos.
   ============================================================ */
import type { Task } from "./types";

const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || `request failed: ${path}`);
  return j.data as T;
}

export const api = {
  health: () => req<{ status: string }>("/api/health"),
  listTasks: () => req<Task[]>("/api/tasks"),
  addTask: (t: Partial<Task>) => req<Task>("/api/tasks", { method: "POST", body: JSON.stringify(t) }),
  toggleTask: (id: string) => req<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({}) }),
  deleteTask: (id: string) => req<{ id: string }>(`/api/tasks/${id}`, { method: "DELETE" }),
  agent: (goal: string) => req<AgentResult>("/api/agent", { method: "POST", body: JSON.stringify({ goal }) }),

  // assistant chat threads
  listChats: () => req<Chat[]>("/api/chats"),
  createChat: () => req<Chat>("/api/chats", { method: "POST", body: JSON.stringify({}) }),
  deleteChat: (id: string) => req<{ id: string }>(`/api/chats/${id}`, { method: "DELETE" }),
  getMessages: (id: string) => req<ChatMessage[]>(`/api/chats/${id}/messages`),
  sendMessage: (id: string, content: string) =>
    req<{ user: ChatMessage; assistant: ChatMessage }>(`/api/chats/${id}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
};

export interface ChangeEvent {
  entity: "tasks" | "chats";
  action: "created" | "updated" | "completed" | "reopened" | "deleted" | "generated";
  label?: string;
  id?: string;
  source: "user" | "agent";
}

/** Subscribe to live server changes over SSE. Returns an unsubscribe fn. */
export function subscribeEvents(onEvent: (e: ChangeEvent) => void): () => void {
  const es = new EventSource(BASE + "/api/events");
  es.onmessage = (ev) => {
    try {
      onEvent(JSON.parse(ev.data) as ChangeEvent);
    } catch {
      /* ignore keep-alives */
    }
  };
  return () => es.close();
}

export interface AgentStep {
  tool: string;
  args: unknown;
  output: string;
}
export interface AgentResult {
  final: string;
  steps: AgentStep[];
}
export interface Chat {
  id: string;
  title: string;
  created: string;
  updated: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  created: string;
}
