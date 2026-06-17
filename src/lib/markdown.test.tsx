import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderInline, MarkdownBody, extractLinks, plainSnippet } from "./markdown";

describe("extractLinks", () => {
  it("pulls all [[wiki-links]] in order", () => {
    expect(extractLinks("see [[A]] and [[B]] then [[A]]")).toEqual(["A", "B", "A"]);
  });
  it("returns [] when there are none", () => {
    expect(extractLinks("plain text")).toEqual([]);
  });
});

describe("plainSnippet", () => {
  it("strips markdown + wiki-brackets and truncates", () => {
    const s = plainSnippet("## Title\n- **bold** and [[Link]] with `code`", 100);
    expect(s).not.toContain("#");
    expect(s).not.toContain("[[");
    expect(s).toContain("Link");
    expect(s).toContain("bold");
  });
  it("respects the length limit", () => {
    expect(plainSnippet("x".repeat(200), 50).length).toBe(50);
  });
});

describe("renderInline", () => {
  it("returns a wikilink element with a click handler", () => {
    const seen: string[] = [];
    const parts = renderInline("go to [[Daily Brief]] now", (n) => seen.push(n), new Set(["daily brief"]));
    const html = renderToStaticMarkup(<>{parts}</>);
    expect(html).toContain("wikilink");
    expect(html).toContain("Daily Brief");
    expect(html).not.toContain("missing");
  });
  it("marks unknown links as missing", () => {
    const html = renderToStaticMarkup(<>{renderInline("[[Ghost]]", undefined, new Set())}</>);
    expect(html).toContain("missing");
  });
  it("renders bold and code", () => {
    const html = renderToStaticMarkup(<>{renderInline("**b** and `c`", undefined, undefined)}</>);
    expect(html).toContain("<strong>b</strong>");
    expect(html).toContain("<code>c</code>");
  });
});

describe("MarkdownBody", () => {
  it("renders headings, lists, quotes, and bold", () => {
    const md = "## Heading\n\nA **bold** line.\n\n- one\n- two\n\n> a quote";
    const html = renderToStaticMarkup(<MarkdownBody text={md} />);
    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>two</li>");
    expect(html).toContain("<blockquote>a quote</blockquote>");
  });
});
