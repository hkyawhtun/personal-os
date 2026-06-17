/* ============================================================
   FloatingAssistant — a Messenger-style chat bubble (FAB) that
   opens a windowed assistant on any tab. It drives the app via the
   agent loop; after any tool runs, onChange() refreshes app state so
   you watch the change happen (e.g. a task appears in the Tasks tab).
   ============================================================ */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { api, type AgentStep } from "../api";
import { Icon } from "../components/icons";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
}

export function FloatingAssistant({ online, onChange }: { online: boolean; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setDraft("");
    setBusy(true);
    setMessages((m) => [...m, { id: "u" + Date.now(), role: "user", content }]);
    try {
      const res = await api.agent(content);
      setMessages((m) => [...m, { id: "a" + Date.now(), role: "assistant", content: res.final, steps: res.steps }]);
      if (res.steps.length > 0) onChange(); // a tool likely changed data — refresh so it's visible
    } catch {
      setMessages((m) => [
        ...m,
        { id: "e" + Date.now(), role: "assistant", content: online ? "Something went wrong reaching the assistant." : "The assistant needs the API server running." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  }

  return (
    <>
      {open && (
        <div className="fab-panel">
          <div className="fab-head">
            <span>
              <Icon.chat size={16} /> Assistant
            </span>
            <button className="btn-icon" onClick={() => setOpen(false)} aria-label="Close">
              <Icon.x />
            </button>
          </div>
          <div className="fab-scroll" ref={scrollRef}>
            {messages.length === 0 && !busy && (
              <div className="fab-hint">Ask me to add, complete, or find a task — you'll see it happen here.</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                {m.role === "assistant" && m.steps && m.steps.length > 0 && (
                  <div className="msg-steps">
                    <Icon.spark size={11} />
                    {m.steps.map((s, i) => (
                      <span key={i} className="msg-step-chip">
                        {s.tool}
                      </span>
                    ))}
                  </div>
                )}
                <div className="msg-bubble">{m.content}</div>
              </div>
            ))}
            {busy && (
              <div className="msg assistant">
                <div className="msg-bubble msg-thinking">
                  <span className="spin" style={{ display: "inline-flex" }}>
                    <Icon.loader size={14} />
                  </span>{" "}
                  Working…
                </div>
              </div>
            )}
          </div>
          <form className="fab-bar" onSubmit={onSubmit}>
            <textarea className="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={1} placeholder="Ask or instruct…" />
            <button type="submit" className="btn btn-primary chat-send" disabled={!draft.trim() || busy} aria-label="Send">
              <Icon.send />
            </button>
          </form>
        </div>
      )}
      <button className={`fab ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Assistant" title="Assistant">
        {open ? <Icon.x size={22} /> : <Icon.chat size={22} />}
      </button>
    </>
  );
}
