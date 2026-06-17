/* ============================================================
   APP SHELL — nav rail, header, theme, routing
   ============================================================ */
import { useEffect, useState } from "react";
import type { Theme, View } from "./types";
import { SEED_LISTS, SEED_TASKS } from "./data";
import { api, subscribeEvents } from "./api";
import { Icon } from "./components/icons";
import { IconButton } from "./components/ui";
import { Tasks } from "./views/Tasks";
import { Chat } from "./views/Chat";
import { FloatingAssistant } from "./views/FloatingAssistant";
import { Toasts, type Toast } from "./views/Toasts";
import type { ChangeEvent } from "./api";
import logoUrl from "./assets/logo.svg?url";

function describeChange(e: ChangeEvent): string {
  const verb: Record<ChangeEvent["action"], string> = {
    created: "Added",
    updated: "Updated",
    completed: "Completed",
    reopened: "Reopened",
    deleted: "Deleted",
    generated: "Generated",
  };
  // "Completed"/"Reopened" already imply task; others name the noun when no label
  return e.action === "completed" || e.action === "reopened"
    ? `${verb[e.action]}${e.label ? ` “${e.label}”` : " task"}`
    : `${verb[e.action]} task${e.label ? ` “${e.label}”` : ""}`;
}

export default function App() {
  const [view, setView] = useState<View>(() => (localStorage.getItem("pos-view") as View) || "tasks");
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("pos-theme") as Theme) || "light");

  // shared state
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [lists] = useState(SEED_LISTS);
  const [activeList, setActiveList] = useState(() => localStorage.getItem("pos-activeList") || "all");

  // online = backend reachable; offline = seed data (standalone demo mode)
  const [online, setOnline] = useState(false);
  // task ids that just changed (live), for a brief highlight
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  // transient toasts announcing assistant actions
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pos-theme", theme);
  }, [theme]);

  // persist current nav (view + active task list) across reloads
  useEffect(() => { localStorage.setItem("pos-view", view); }, [view]);
  useEffect(() => { localStorage.setItem("pos-activeList", activeList); }, [activeList]);

  // live updates: any server-side change (other tabs, the agent) pushes an SSE
  // event; re-pull that entity so the UI reacts without a refresh.
  useEffect(() => {
    if (!online) return;
    return subscribeEvents((e) => {
      // ignore changes this client made itself (already reflected locally);
      // only react to agent-driven changes.
      if (e.source !== "agent") return;
      if (e.entity === "tasks") {
        api.listTasks().then(setTasks).catch(() => {});
        if (e.id) {
          const id = e.id;
          setFlashIds((s) => new Set(s).add(id));
          setTimeout(() => setFlashIds((s) => { const n = new Set(s); n.delete(id); return n; }), 1600);
        }
      }

      // announce assistant actions globally
      if (e.source === "agent" && e.entity !== "chats") {
        const id = "toast" + Date.now() + Math.random();
        setToasts((ts) => [...ts, { id, text: describeChange(e) }]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
      }
    });
  }, [online]);

  // Hydrate from the API if it's up; otherwise stay on seed data.
  useEffect(() => {
    (async () => {
      try {
        await api.health();
        const [t] = await Promise.all([api.listTasks()]);
        setTasks(t);
        setOnline(true);
      } catch {
        /* backend down — keep seed data */
      }
    })();
  }, []);

  /* ---- mutations: optimistic local update, persisted when online ---- */
  async function addTask(f: { title: string; list: string; due: string | null; priority?: boolean }) {
    if (online) {
      try {
        const t = await api.addTask(f);
        setTasks((ts) => [t, ...ts]);
        return;
      } catch {
        /* fall through to local */
      }
    }
    setTasks((ts) => [{ id: "t" + Date.now(), list: f.list, title: f.title, due: f.due, done: false, priority: f.priority }, ...ts]);
  }
  function toggleTask(id: string) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    if (online) api.toggleTask(id).catch(() => {});
  }
  function deleteTask(id: string) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    if (online) api.deleteTask(id).catch(() => {});
  }

  const openTaskCount = tasks.filter((t) => !t.done).length;

  function go(v: View) {
    setView(v);
  }

  // re-pull app state from the API — used after the floating assistant runs a
  // tool, so changes it makes are visible in the current tab.
  async function refresh() {
    if (!online) return;
    try {
      setTasks(await api.listTasks());
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="app">
      {/* ---------- TOP NAV ---------- */}
      <header className="topnav">
        <div className="topnav-brand">
          <img className="rail-logo" src={logoUrl} width={28} height={28} alt="Personal OS" />
          <strong>Personal OS</strong>
        </div>
        <nav className="topnav-tabs">
          <button className={`topnav-tab ${view === "tasks" ? "active" : ""}`} onClick={() => go("tasks")}>
            <Icon.tasks />
            <span>Tasks</span>
            <span className="nav-count">{openTaskCount}</span>
          </button>
          <button className={`topnav-tab ${view === "chat" ? "active" : ""}`} onClick={() => go("chat")}>
            <Icon.chat />
            <span>Assistant</span>
          </button>
        </nav>
        <div className="topnav-right">
          <IconButton
            icon={theme === "light" ? <Icon.moon /> : <Icon.sun />}
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            title="Toggle theme"
          />
        </div>
      </header>

      {/* ---------- VIEW ---------- */}
      <div className="view">
        {view === "tasks" && (
          <div className="scroll">
            <Tasks tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} lists={lists} activeList={activeList} setActiveList={setActiveList} flashIds={flashIds} />
          </div>
        )}
        {view === "chat" && <Chat online={online} />}
      </div>

      {/* persistent quick-access assistant on every tab except the full Assistant view */}
      {view !== "chat" && <FloatingAssistant online={online} onChange={refresh} />}

      <Toasts toasts={toasts} />
    </div>
  );
}
