import { describe, it, expect } from "vitest";
import { parseDate, dayDiff, fmtDue, fmtShort, fmtFull } from "./dates";

// All due-date math is relative to TODAY (Jun 3 2026) in data.ts.
const TODAY = new Date(2026, 5, 3);

describe("parseDate", () => {
  it("parses YYYY-MM-DD into a local Date", () => {
    const d = parseDate("2026-06-03")!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(3);
  });
  it("returns null for empty input", () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate("")).toBeNull();
  });
});

describe("dayDiff", () => {
  it("counts whole days between dates", () => {
    expect(dayDiff(parseDate("2026-06-05")!, TODAY)).toBe(2);
    expect(dayDiff(parseDate("2026-06-01")!, TODAY)).toBe(-2);
    expect(dayDiff(TODAY, TODAY)).toBe(0);
  });
});

describe("fmtDue", () => {
  it("labels today and tomorrow as 'soon'", () => {
    expect(fmtDue("2026-06-03", TODAY)).toEqual({ label: "Today", cls: "soon" });
    expect(fmtDue("2026-06-04", TODAY)).toEqual({ label: "Tomorrow", cls: "soon" });
  });
  it("labels overdue with day count and 'over' class", () => {
    expect(fmtDue("2026-06-02", TODAY)).toEqual({ label: "Yesterday", cls: "over" });
    expect(fmtDue("2026-06-01", TODAY)).toEqual({ label: "2d overdue", cls: "over" });
  });
  it("uses a weekday name within the coming week", () => {
    const r = fmtDue("2026-06-06", TODAY)!; // Saturday
    expect(r.cls).toBe("");
    expect(r.label).toBe("Sat");
  });
  it("uses month + day when more than a week out", () => {
    const r = fmtDue("2026-07-01", TODAY)!;
    expect(r.cls).toBe("");
    expect(r.label).toBe("Jul 1");
  });
  it("returns null for no date", () => {
    expect(fmtDue(null, TODAY)).toBeNull();
  });
});

describe("fmtShort / fmtFull", () => {
  it("formats short and full dates", () => {
    expect(fmtShort("2026-06-03")).toBe("Jun 3");
    expect(fmtFull("2026-06-03")).toBe("Wednesday, June 3");
    expect(fmtShort(null)).toBe("");
  });
});
