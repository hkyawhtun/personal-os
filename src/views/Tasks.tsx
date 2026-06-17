/* ============================================================
   TASKS SURFACE
   ============================================================ */
import { useRef, useState, type Dispatch, type SetStateAction, type FormEvent } from "react";
import type { List, Task } from "../types";
import { TODAY } from "../data";
import { dayDiff, fmtDue, parseDate } from "../lib/dates";
import { Icon } from "../components/icons";
import { Button } from "../components/ui";

interface TasksProps {
  tasks: Task[];
  onAdd: (fields: { title: string; list: string; due: string | null; priority?: boolean }) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  lists: List[];
  activeList: string;
  setActiveList: Dispatch<SetStateAction<string>>;
  flashIds?: Set<string>;
}

export function Tasks({ tasks, onAdd, onToggle, onDelete, lists, activeList, setActiveList, flashIds }: TasksProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = activeList === "all" ? tasks : tasks.filter((t) => t.list === activeList);
  const open = visible.filter((t) => !t.done);
  const done = visible.filter((t) => t.done);

  // group open tasks: overdue / today / upcoming / no-date
  const groups: Record<string, Task[]> = { Overdue: [], Today: [], Upcoming: [], "No date": [] };
  open.forEach((t) => {
    if (!t.due) groups["No date"].push(t);
    else {
      const diff = dayDiff(parseDate(t.due)!, TODAY);
      if (diff < 0) groups.Overdue.push(t);
      else if (diff === 0) groups.Today.push(t);
      else groups.Upcoming.push(t);
    }
  });
  groups.Upcoming.sort((a, b) => (a.due || "").localeCompare(b.due || ""));

  function toggle(id: string) {
    onToggle(id);
  }
  function del(id: string) {
    onDelete(id);
  }
  function add(e: FormEvent) {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    const listId = activeList === "all" ? "inbox" : activeList;
    // crude "today"/"tomorrow" parsing for delight
    let due: string | null = null;
    let title = v;
    if (/\btoday\b/i.test(v)) {
      due = "2026-06-03";
      title = v.replace(/\btoday\b/i, "").trim();
    } else if (/\btomorrow\b/i.test(v)) {
      due = "2026-06-04";
      title = v.replace(/\btomorrow\b/i, "").trim();
    }
    onAdd({ title, list: listId, due });
    setDraft("");
  }

  const counts: Record<string, number> = {};
  lists.forEach((l) => {
    counts[l.id] = tasks.filter((t) => t.list === l.id && !t.done).length;
  });

  return (
    <div className="content fade-in">
      <div className="list-tabs">
        <button className={`list-tab ${activeList === "all" ? "active" : ""}`} onClick={() => setActiveList("all")}>
          All <span className="count">{tasks.filter((t) => !t.done).length}</span>
        </button>
        {lists.map((l) => (
          <button key={l.id} className={`list-tab ${activeList === l.id ? "active" : ""}`} onClick={() => setActiveList(l.id)}>
            <span className="dot" style={{ background: l.color }} />
            {l.name}
            {counts[l.id] > 0 && <span className="count">{counts[l.id]}</span>}
          </button>
        ))}
      </div>

      <form className="quick-add" onSubmit={add}>
        <span className="add-plus">
          <Icon.plus size={18} />
        </span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add to ${activeList === "all" ? "Inbox" : lists.find((l) => l.id === activeList)?.name}…  (try "Email Sam tomorrow")`}
        />
        {draft.trim() && (
          <Button variant="primary" size="sm" type="submit">
            Add
          </Button>
        )}
      </form>

      {open.length === 0 && done.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-faint)" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <Icon.inbox size={32} />
          </div>
          Nothing here yet. Add your first task above.
        </div>
      )}

      {["Overdue", "Today", "Upcoming", "No date"].map((g) =>
        groups[g].length > 0 ? (
          <div key={g}>
            <div className="task-group-label" style={g === "Overdue" ? { color: "var(--danger)" } : {}}>
              {g}{" "}
              <span className="mono" style={{ fontWeight: 400 }}>
                {groups[g].length}
              </span>
            </div>
            {groups[g].map((t) => (
              <TaskRow key={t.id} task={t} lists={lists} showList={activeList === "all"} onToggle={toggle} onDelete={del} flash={flashIds?.has(t.id)} />
            ))}
          </div>
        ) : null,
      )}

      {done.length > 0 && (
        <details style={{ marginTop: 32 }}>
          <summary
            style={{
              cursor: "pointer",
              color: "var(--text-faint)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
            }}
          >
            <Icon.check size={13} /> {done.length} completed
          </summary>
          <div style={{ marginTop: 4 }}>
            {done.map((t) => (
              <TaskRow key={t.id} task={t} lists={lists} showList={activeList === "all"} onToggle={toggle} onDelete={del} flash={flashIds?.has(t.id)} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  lists: List[];
  showList: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  flash?: boolean;
}

function TaskRow({ task, lists, showList, onToggle, onDelete, flash }: TaskRowProps) {
  const due = task.due ? fmtDue(task.due) : null;
  const list = lists.find((l) => l.id === task.list);
  return (
    <div className={`task-row ${task.done ? "done" : ""} ${flash ? "flash" : ""}`}>
      <button className={`checkbox ${task.done ? "checked" : ""}`} onClick={() => onToggle(task.id)} aria-label="toggle">
        <Icon.check />
      </button>
      <div className="task-body">
        <div className="task-title">
          {task.priority && !task.done && (
            <span style={{ color: "var(--warning)", marginRight: 6, verticalAlign: "middle", display: "inline-flex" }}>
              <Icon.flag />
            </span>
          )}
          {task.title}
        </div>
        <div className="task-meta">
          {showList && list && (
            <span className="due" style={{ color: "var(--text-faint)" }}>
              <span className="tag-dot" style={{ background: list.color }} />
              {list.name}
            </span>
          )}
          {due && (
            <span className={`due ${due.cls}`}>
              <Icon.cal /> {due.label}
            </span>
          )}
          {task.note && <span className="task-note">{task.note}</span>}
        </div>
      </div>
      <button className="task-del" onClick={() => onDelete(task.id)} aria-label="delete">
        <Icon.trash />
      </button>
    </div>
  );
}
