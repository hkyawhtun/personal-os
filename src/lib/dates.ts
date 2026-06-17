/* Date helpers. All due-date math is relative to TODAY (see data.ts). */
import { TODAY } from "../data";

export function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export interface DueLabel {
  label: string;
  cls: "" | "soon" | "over";
}

export function fmtDue(s?: string | null, today: Date = TODAY): DueLabel | null {
  const d = parseDate(s);
  if (!d) return null;
  const diff = dayDiff(d, today);
  let label: string;
  let cls: DueLabel["cls"] = "";
  if (diff < 0) {
    label = diff === -1 ? "Yesterday" : `${-diff}d overdue`;
    cls = "over";
  } else if (diff === 0) {
    label = "Today";
    cls = "soon";
  } else if (diff === 1) {
    label = "Tomorrow";
    cls = "soon";
  } else if (diff < 7) {
    label = d.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return { label, cls };
}

export function fmtFull(s?: string | null): string {
  const d = parseDate(s);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function fmtShort(s?: string | null): string {
  const d = parseDate(s);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
