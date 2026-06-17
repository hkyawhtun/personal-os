/* Shared domain types for the Node side (core / server / cli / ai).
   The web has its own copy in src/types.ts (separate build graph). */

export interface List {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  list: string;
  title: string;
  note?: string;
  due?: string | null;
  done: boolean;
  priority?: boolean;
}

/** A live change notification (broadcast over SSE). */
export interface ChangeEvent {
  entity: "tasks" | "chats";
  action: "created" | "updated" | "completed" | "reopened" | "deleted" | "generated";
  label?: string; // human summary, e.g. the task/note title
  id?: string;
  source: "user" | "agent"; // "agent" when made by the assistant loop
}

/** A single tool call the agent loop made. */
export interface AgentStep {
  tool: string;
  args: unknown;
  output: string;
}

/** An assistant chat thread + its messages. */
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

/** Input shapes for mutations. */
export interface NewTask {
  title: string;
  list?: string;
  due?: string | null;
  note?: string | null;
  priority?: boolean;
}
