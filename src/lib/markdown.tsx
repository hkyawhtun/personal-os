/* ============================================================
   Minimal markdown + [[wiki-link]] renderer.
   Supports: ## / ### headings, > blockquotes, - lists,
   **bold**, `code`, and [[wiki-links]].
   ============================================================ */
import type { ReactNode } from "react";

type LinkHandler = ((name: string) => void) | null | undefined;

export function renderInline(
  text: string,
  onLink?: LinkHandler,
  noteTitles?: Set<string>,
): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("[[")) {
      const name = tok.slice(2, -2);
      const exists = !noteTitles || noteTitles.has(name.toLowerCase());
      parts.push(
        <a
          key={key++}
          className={`wikilink ${exists ? "" : "missing"}`}
          onClick={(e) => {
            e.preventDefault();
            onLink && onLink(name);
          }}
        >
          {name}
        </a>,
      );
    } else if (tok.startsWith("**")) {
      parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      parts.push(<code key={key++}>{tok.slice(1, -1)}</code>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface MarkdownBodyProps {
  text: string;
  onLink?: LinkHandler;
  noteTitles?: Set<string>;
}

export function MarkdownBody({ text, onLink, noteTitles }: MarkdownBodyProps) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key++}>{renderInline(line.slice(3), onLink, noteTitles)}</h2>);
      i++;
    } else if (line.startsWith("### ")) {
      blocks.push(<h3 key={key++}>{renderInline(line.slice(4), onLink, noteTitles)}</h3>);
      i++;
    } else if (line.startsWith("> ")) {
      blocks.push(<blockquote key={key++}>{renderInline(line.slice(2), onLink, noteTitles)}</blockquote>);
      i++;
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, onLink, noteTitles)}</li>
          ))}
        </ul>,
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      blocks.push(<p key={key++}>{renderInline(line, onLink, noteTitles)}</p>);
      i++;
    }
  }
  return <div className="note-body">{blocks}</div>;
}

export function extractLinks(body: string): string[] {
  const out: string[] = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) out.push(m[1]);
  return out;
}

export function plainSnippet(body: string, n = 120): string {
  return body
    .replace(/[#>*`\-]/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, n);
}
