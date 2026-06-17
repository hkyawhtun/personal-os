/* Shared domain types for Personal OS. */

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

export type View = "tasks" | "chat";
export type Theme = "light" | "dark";
