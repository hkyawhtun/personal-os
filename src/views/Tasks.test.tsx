import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Tasks } from "./Tasks";
import { SEED_LISTS } from "../data";
import type { Task } from "../types";

function Harness({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [activeList, setActiveList] = useState("all");
  let n = 0;
  const onAdd = (f: { title: string; list: string; due: string | null; priority?: boolean }) =>
    setTasks((ts) => [{ id: "x" + n++, list: f.list, title: f.title, due: f.due, done: false, priority: f.priority }, ...ts]);
  const onToggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const onDelete = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));
  return <Tasks tasks={tasks} onAdd={onAdd} onToggle={onToggle} onDelete={onDelete} lists={SEED_LISTS} activeList={activeList} setActiveList={setActiveList} />;
}

const TASKS: Task[] = [
  { id: "a", list: "work", title: "Work item", done: false },
  { id: "b", list: "personal", title: "Personal item", done: false },
];

describe("Tasks", () => {
  it("adds a task via quick-add", async () => {
    const user = userEvent.setup();
    render(<Harness initial={TASKS} />);
    await user.type(screen.getByPlaceholderText(/Add to/), "Buy groceries");
    await user.keyboard("{Enter}");
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("completes a task via its checkbox", async () => {
    const user = userEvent.setup();
    render(<Harness initial={TASKS} />);
    const row = screen.getByText("Work item").closest(".task-row") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "toggle" }));
    expect(screen.getByText("Work item").closest(".task-row")).toHaveClass("done");
  });

  it("deletes a task", async () => {
    const user = userEvent.setup();
    render(<Harness initial={TASKS} />);
    const row = screen.getByText("Work item").closest(".task-row") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "delete" }));
    expect(screen.queryByText("Work item")).not.toBeInTheDocument();
  });

  it("filters by list when a list tab is selected", async () => {
    const user = userEvent.setup();
    render(<Harness initial={TASKS} />);
    expect(screen.getByText("Personal item")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Work/ }));
    expect(screen.queryByText("Personal item")).not.toBeInTheDocument();
    expect(screen.getByText("Work item")).toBeInTheDocument();
  });
});
