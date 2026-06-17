import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Brain } from "./Brain";
import type { Note } from "../types";

/** Stateful harness: Brain is controlled, so the parent owns notes + selection. */
function Harness({ initial }: { initial: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initial);
  const [activeNoteId, setActiveNoteId] = useState(initial[0].id);
  const [search, setSearch] = useState("");
  const [contextOpen, setContextOpen] = useState(true);
  const onSaveNote = (n: Note) => setNotes((ns) => ns.map((x) => (x.id === n.id ? n : x)));
  const onNewNote = (): Note => {
    const n: Note = { id: "new1", title: "Untitled note", tags: [], updated: "2026-06-03", body: "" };
    setNotes((ns) => [n, ...ns]);
    return n;
  };
  return (
    <Brain
      notes={notes}
      onSaveNote={onSaveNote}
      onNewNote={onNewNote}
      activeNoteId={activeNoteId}
      setActiveNoteId={setActiveNoteId}
      search={search}
      setSearch={setSearch}
      contextOpen={contextOpen}
      setContextOpen={setContextOpen}
    />
  );
}

const NOTES: Note[] = [
  { id: "n1", title: "Daily Brief", tags: ["alpha"], updated: "2026-06-03", body: "See [[Second Brain]] for more." },
  { id: "n2", title: "Second Brain", tags: ["system"], updated: "2026-05-30", body: "Notes that link." },
];

describe("Brain — tags", () => {
  it("adds a tag via the + tag control", async () => {
    const user = userEvent.setup();
    render(<Harness initial={NOTES} />);

    // existing tag is shown as a removable button
    const meta = document.querySelector(".editor-meta") as HTMLElement;
    expect(within(meta).getByRole("button", { name: "alpha" })).toBeInTheDocument();

    await user.click(within(meta).getByRole("button", { name: "tag" })); // the "+ tag" button
    const input = screen.getByPlaceholderText("tag…");
    await user.type(input, "beta");
    await user.keyboard("{Enter}");

    expect(within(meta).getByRole("button", { name: "beta" })).toBeInTheDocument();
  });

  it("removes a tag by clicking it", async () => {
    const user = userEvent.setup();
    render(<Harness initial={NOTES} />);
    const meta = document.querySelector(".editor-meta") as HTMLElement;
    await user.click(within(meta).getByRole("button", { name: "alpha" }));
    expect(within(meta).queryByRole("button", { name: "alpha" })).not.toBeInTheDocument();
  });

  it("does not add duplicate or empty tags", async () => {
    const user = userEvent.setup();
    render(<Harness initial={NOTES} />);
    const meta = document.querySelector(".editor-meta") as HTMLElement;
    await user.click(within(meta).getByRole("button", { name: "tag" }));
    await user.type(screen.getByPlaceholderText("tag…"), "alpha");
    await user.keyboard("{Enter}");
    // still exactly one "alpha"
    expect(within(meta).getAllByRole("button", { name: "alpha" })).toHaveLength(1);
  });
});

describe("Brain — navigation & editing", () => {
  it("creates a new note via New note", async () => {
    const user = userEvent.setup();
    render(<Harness initial={NOTES} />);
    await user.click(screen.getByRole("button", { name: /new note/i }));
    expect(screen.getByDisplayValue("Untitled note")).toBeInTheDocument();
  });

  it("toggles the editor textarea with Edit", async () => {
    const user = userEvent.setup();
    render(<Harness initial={NOTES} />);
    expect(screen.queryByPlaceholderText(/start writing/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByPlaceholderText(/start writing/i)).toBeInTheDocument();
  });

  it("follows a [[wiki-link]] to the target note", async () => {
    const user = userEvent.setup();
    render(<Harness initial={NOTES} />);
    // active note is Daily Brief; click its wiki-link to Second Brain
    await user.click(screen.getByText("Second Brain", { selector: "a.wikilink" }));
    expect(screen.getByDisplayValue("Second Brain")).toBeInTheDocument(); // editor title input
  });

  it("filters the note list by search", async () => {
    const user = userEvent.setup();
    render(<Harness initial={NOTES} />);
    const list = document.querySelector(".note-list") as HTMLElement;
    expect(within(list).getByText("Second Brain")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search notes…"), "daily");
    expect(within(list).queryByText("Second Brain")).not.toBeInTheDocument();
    expect(within(list).getByText("Daily Brief")).toBeInTheDocument();
  });
});
