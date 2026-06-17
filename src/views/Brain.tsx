/* ============================================================
   BRAIN SURFACE — note list + editor + backlinks
   ============================================================ */
import { useMemo, useRef, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import type { Note } from "../types";
import { fmtFull, fmtShort } from "../lib/dates";
import { MarkdownBody, extractLinks, plainSnippet, renderInline } from "../lib/markdown";
import { Icon } from "../components/icons";
import { Button, IconButton, TagChip } from "../components/ui";

interface BrainProps {
  notes: Note[];
  onSaveNote: (note: Note) => void;
  onNewNote: () => Note;
  activeNoteId: string;
  setActiveNoteId: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  contextOpen: boolean;
  setContextOpen: Dispatch<SetStateAction<boolean>>;
}

export function Brain({
  notes,
  onSaveNote,
  onNewNote,
  activeNoteId,
  setActiveNoteId,
  search,
  setSearch,
  contextOpen,
  setContextOpen,
}: BrainProps) {
  const [editing, setEditing] = useState(false);
  const [listOpenMobile, setListOpenMobile] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  const titleMap = useMemo(() => {
    const m = new Map<string, Note>();
    notes.forEach((n) => m.set(n.title.toLowerCase(), n));
    return m;
  }, [notes]);
  const titleSet = useMemo(() => new Set(notes.map((n) => n.title.toLowerCase())), [notes]);

  const active = notes.find((n) => n.id === activeNoteId) || notes[0];

  // Empty state: no notes yet. Guard before any `active.*` access so the Brain
  // never crashes (white-screens the app) when the notes list is empty.
  if (!active) {
    return (
      <div className="brain-layout" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p className="faint" style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-md)" }}>No notes yet. Start your Second Brain.</p>
          <Button onClick={newNote}>New note</Button>
        </div>
      </div>
    );
  }

  const filtered = notes
    .filter(
      (n) =>
        !search.trim() ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => b.updated.localeCompare(a.updated));

  // backlinks: notes whose body links to active.title
  const backlinks = notes.filter(
    (n) => n.id !== active.id && extractLinks(n.body).some((l) => l.toLowerCase() === active.title.toLowerCase()),
  );

  function navigateTo(name: string) {
    const n = titleMap.get(name.toLowerCase());
    if (n) {
      setActiveNoteId(n.id);
      setEditing(false);
    }
  }
  function openNote(id: string) {
    setActiveNoteId(id);
    setEditing(false);
    setListOpenMobile(false);
  }
  function updateBody(body: string) {
    onSaveNote({ ...active, body, updated: "2026-06-03" });
  }
  function updateTitle(title: string) {
    onSaveNote({ ...active, title, updated: "2026-06-03" });
  }
  function newNote() {
    const n = onNewNote();
    setActiveNoteId(n.id);
    setEditing(true);
  }
  function addTag(raw: string) {
    const tag = raw.trim().replace(/^#/, "");
    setTagDraft("");
    if (!tag || active.tags.includes(tag)) return;
    onSaveNote({ ...active, tags: [...active.tags, tag], updated: "2026-06-03" });
  }
  function removeTag(tag: string) {
    onSaveNote({ ...active, tags: active.tags.filter((t) => t !== tag), updated: "2026-06-03" });
  }

  /* ---- formatting controls (insert markdown at the cursor) ---- */
  const taRef = useRef<HTMLTextAreaElement>(null);
  function restore(pos: number) {
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }
  function wrap(before: string, after: string) {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const v = active.body;
    const sel = v.slice(s, e);
    updateBody(v.slice(0, s) + before + sel + after + v.slice(e));
    restore(s + before.length + sel.length);
  }
  function linePrefix(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const v = active.body;
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    updateBody(v.slice(0, lineStart) + prefix + v.slice(lineStart));
    restore(s + prefix.length);
  }

  // backlink snippet with highlighted mention
  function snippetFor(note: Note): ReactNode[] {
    const line =
      note.body.split("\n").find((l) => l.toLowerCase().includes(`[[${active.title.toLowerCase()}`)) ||
      note.body.split("\n").find(Boolean) ||
      "";
    return renderInline(line.replace(/^[#>\-\s]+/, ""), null, titleSet);
  }

  return (
    <div className="brain-layout">
      <div className={`note-list ${listOpenMobile ? "" : "mobile-hidden"}`}>
        <div className="note-list-head">
          <div className="search" style={{ marginBottom: 10 }}>
            <Icon.search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…" />
          </div>
          <Button variant="secondary" size="sm" icon={<Icon.plus size={16} />} onClick={newNote} style={{ width: "100%" }}>
            New note
          </Button>
        </div>
        <div className="note-list-scroll">
          {filtered.length === 0 && (
            <div className="faint" style={{ padding: 16, fontSize: "var(--text-sm)" }}>
              No notes match "{search}"
            </div>
          )}
          {filtered.map((n) => (
            <button key={n.id} className={`note-item ${n.id === active.id ? "active" : ""}`} onClick={() => openNote(n.id)}>
              <h4>{n.title}</h4>
              <p>{plainSnippet(n.body, 60) || "Empty note"}</p>
              <div className="note-item-meta">
                <span className="note-item-date">{fmtShort(n.updated)}</span>
                {n.tags.slice(0, 2).map((t) => (
                  <span key={t} className="tag" style={{ height: 18, fontSize: 11 }}>
                    #{t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="editor scroll">
        <div className="editor-inner">
          <input className="editor-title" value={active.title} onChange={(e) => updateTitle(e.target.value)} placeholder="Untitled note" />
          <div className="editor-meta">
            <span className="due" style={{ color: "var(--text-faint)" }}>
              <Icon.clock /> Edited {fmtFull(active.updated)}
            </span>
            {active.tags.map((t) => (
              <button key={t} className="tag" onClick={() => removeTag(t)} title="Remove tag">
                <Icon.tag /> {t} <Icon.x size={11} />
              </button>
            ))}
            {addingTag ? (
              <input
                className="tag-input"
                autoFocus
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTag(tagDraft);
                  else if (e.key === "Escape") { setTagDraft(""); setAddingTag(false); }
                }}
                onBlur={() => { addTag(tagDraft); setAddingTag(false); }}
                placeholder="tag…"
              />
            ) : (
              <button className="tag" style={{ background: "transparent", border: "1px dashed var(--border-strong)" }} onClick={() => setAddingTag(true)}>
                <Icon.plus size={12} /> tag
              </button>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
              {editing && (
                <div className="fmt-bar" onMouseDown={(e) => e.preventDefault()}>
                  <button className="fmt-btn" title="Heading" onClick={() => linePrefix("## ")}>H</button>
                  <button className="fmt-btn" title="Bullet list" onClick={() => linePrefix("- ")}>•</button>
                  <button className="fmt-btn" title="Bold" onClick={() => wrap("**", "**")}><b>B</b></button>
                  <button className="fmt-btn" title="Link a note" onClick={() => wrap("[[", "]]")}>[[ ]]</button>
                </div>
              )}
              <Button variant={editing ? "primary" : "ghost"} size="sm" onClick={() => setEditing((v) => !v)}>
                {editing ? "Done" : "Edit"}
              </Button>
            </div>
          </div>

          {editing ? (
            <textarea
              ref={taRef}
              className="editor-textarea"
              value={active.body}
              autoFocus
              onChange={(e) => updateBody(e.target.value)}
              placeholder="Start writing…"
            />
          ) : active.body.trim() ? (
            <MarkdownBody text={active.body} onLink={navigateTo} noteTitles={titleSet} />
          ) : (
            <p className="faint" style={{ fontStyle: "italic" }}>
              Empty note. Hit Edit to start writing.
            </p>
          )}
        </div>
      </div>

      <BrainContext
        active={active}
        backlinks={backlinks}
        snippetFor={snippetFor}
        onOpen={openNote}
        onNavTitle={navigateTo}
        contextOpen={contextOpen}
        setContextOpen={setContextOpen}
      />
    </div>
  );
}

interface BrainContextProps {
  active: Note;
  backlinks: Note[];
  snippetFor: (note: Note) => ReactNode[];
  onOpen: (id: string) => void;
  onNavTitle: (name: string) => void;
  contextOpen: boolean;
  setContextOpen: Dispatch<SetStateAction<boolean>>;
}

function BrainContext({ active, backlinks, snippetFor, onOpen, onNavTitle, contextOpen, setContextOpen }: BrainContextProps) {
  const outgoing = extractLinks(active.body);
  return (
    <aside className={`context ${contextOpen ? "" : "hidden"}`}>
      <div className="context-inner">
        <div className="context-head">
          <h3>Connections</h3>
          <IconButton icon={<Icon.x />} onClick={() => setContextOpen(false)} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <div className="faint mono" style={{ fontSize: 11, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.link size={13} /> {backlinks.length} BACKLINK{backlinks.length === 1 ? "" : "S"}
          </div>
          {backlinks.length === 0 && (
            <p className="faint" style={{ fontSize: "var(--text-sm)" }}>
              No notes link here yet.
            </p>
          )}
          {backlinks.map((n) => (
            <button key={n.id} className="backlink-card" onClick={() => onOpen(n.id)}>
              <h5>{n.title}</h5>
              <p>{snippetFor(n)}</p>
            </button>
          ))}
        </div>

        <div>
          <div className="faint mono" style={{ fontSize: 11, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.arrow size={13} /> {outgoing.length} LINKED FROM THIS NOTE
          </div>
          {outgoing.length === 0 && (
            <p className="faint" style={{ fontSize: "var(--text-sm)" }}>
              No outgoing links.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[...new Set(outgoing)].map((l) => (
              <TagChip key={l} dot onClick={() => onNavTitle(l)}>
                {l}
              </TagChip>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
