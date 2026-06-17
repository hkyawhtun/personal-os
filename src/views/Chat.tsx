/* ============================================================
   CHAT — a ChatGPT-style assistant over our owned agent loop.
   Threads + messages persist in the DB (survive refresh); each
   thread has multi-turn memory. Messages post to
   /api/chats/:id/messages, which runs the agent with history.
   ============================================================ */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { api, type Chat as ChatThread, type ChatMessage } from "../api";
import { Icon } from "../components/icons";

const SUGGESTIONS = [
  "What's due today?",
  "Add a task to call the dentist tomorrow",
  "What's on my plate for work?",
  "Mark the board deck as done",
];

const THINKING = ["Thinking", "Checking your tasks", "Reasoning", "Working on it"];

function Thinking() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % THINKING.length), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="msg-thinking">
      <span className="spin" style={{ display: "inline-flex" }}>
        <Icon.loader size={14} />
      </span>{" "}
      {THINKING[i]}…
    </span>
  );
}

export function Chat({ online }: { online: boolean }) {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem("pos-chat"));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // load threads on mount; restore the last-active one
  useEffect(() => {
    (async () => {
      try {
        const cs = await api.listChats();
        setChats(cs);
        const saved = localStorage.getItem("pos-chat");
        const pick = (saved && cs.find((c) => c.id === saved)?.id) || cs[0]?.id || null;
        if (pick) {
          setActiveId(pick);
          setMessages(await api.getMessages(pick));
        }
      } catch {
        /* offline — chat unavailable */
      }
    })();
  }, []);

  useEffect(() => {
    if (activeId) localStorage.setItem("pos-chat", activeId);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function selectChat(id: string) {
    setActiveId(id);
    try {
      setMessages(await api.getMessages(id));
    } catch {
      setMessages([]);
    }
  }

  async function newChat() {
    try {
      const c = await api.createChat();
      setChats((cs) => [c, ...cs]);
      setActiveId(c.id);
      setMessages([]);
    } catch {
      /* offline */
    }
  }

  async function removeChat(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.deleteChat(id);
      setChats((cs) => cs.filter((c) => c.id !== id));
      if (activeId === id) {
        const next = chats.find((c) => c.id !== id);
        if (next) await selectChat(next.id);
        else { setActiveId(null); setMessages([]); localStorage.removeItem("pos-chat"); }
      }
    } catch {
      /* offline */
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    let chatId = activeId;
    if (!chatId) {
      try {
        const c = await api.createChat();
        setChats((cs) => [c, ...cs]);
        setActiveId(c.id);
        chatId = c.id;
      } catch {
        return;
      }
    }
    setDraft("");
    setBusy(true);
    const temp: ChatMessage = { id: "tmp" + Date.now(), chatId, role: "user", content, created: "" };
    setMessages((m) => [...m, temp]);
    try {
      const res = await api.sendMessage(chatId, content);
      setMessages((m) => [...m.filter((x) => x.id !== temp.id), res.user, res.assistant]);
      api.listChats().then(setChats).catch(() => {}); // refresh titles + ordering
    } catch {
      setMessages((m) => [
        ...m,
        { id: "err" + Date.now(), chatId: chatId!, role: "assistant", content: online ? "Something went wrong reaching the assistant." : "The assistant needs the API server running (it's offline).", created: "" },
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
    <div className="chat-layout">
      <aside className="chat-threads">
        <button className="btn btn-secondary btn-sm chat-new" onClick={newChat}>
          <Icon.plus size={16} /> New chat
        </button>
        {chats.map((c) => (
          <button key={c.id} className={`thread-item ${c.id === activeId ? "active" : ""}`} onClick={() => selectChat(c.id)}>
            <Icon.chat size={15} />
            <span className="thread-title">{c.title}</span>
            <span className="thread-del" onClick={(e) => removeChat(c.id, e)} title="Delete chat">
              <Icon.trash size={14} />
            </span>
          </button>
        ))}
      </aside>

      <div className="chat-wrap">
        <div className="chat-scroll" ref={scrollRef}>
          {messages.length === 0 && !busy ? (
            <div className="chat-empty">
              <div className="glyph">
                <Icon.chat size={28} />
              </div>
              <h2>Ask your Personal OS</h2>
              <p>It can answer questions about your tasks — and take action, like adding, completing, or deleting a task.</p>
              <div className="chat-suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chat-chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-inner">
              {messages.map((m) => (
                <div key={m.id} className={`msg ${m.role}`}>
                  {m.role === "assistant" && m.steps && m.steps.length > 0 && (
                    <div className="msg-steps">
                      <Icon.spark size={12} />
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
                  <div className="msg-bubble">
                    <Thinking />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="chat-bar">
          <form onSubmit={onSubmit}>
            <textarea
              className="chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Ask about your tasks…"
            />
            <button type="submit" className="btn btn-primary chat-send" disabled={!draft.trim() || busy} aria-label="Send">
              <Icon.send />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
