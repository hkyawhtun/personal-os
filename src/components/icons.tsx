/* ============================================================
   ICONS — Lucide (clean, consistent stroke icons).
   Keeps the Icon.<name> API the rest of the app already uses;
   each accepts an optional `size` (and any svg props).
   ============================================================ */
import type { CSSProperties } from "react";
import {
  Sparkles,
  ListTodo,
  Network,
  Search,
  Plus,
  Check,
  Sun,
  Moon,
  PanelRight,
  PanelLeft,
  Menu,
  Link2,
  Calendar,
  Trash2,
  ArrowRight,
  RefreshCw,
  LoaderCircle,
  Clock,
  Tag,
  ChevronRight,
  Flag,
  X,
  Inbox,
  MessageSquare,
  SendHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function make(C: LucideIcon, def = 18) {
  return ({ size, ...rest }: IconProps) => (
    <C size={size ?? def} strokeWidth={1.75} absoluteStrokeWidth {...rest} />
  );
}

export const Icon = {
  brief: make(Sparkles),
  tasks: make(ListTodo),
  brain: make(Network),
  search: make(Search),
  plus: make(Plus),
  check: make(Check, 14),
  sun: make(Sun),
  moon: make(Moon),
  panel: make(PanelRight),
  rail: make(PanelLeft),
  menu: make(Menu),
  link: make(Link2),
  cal: make(Calendar, 13),
  trash: make(Trash2, 16),
  spark: make(Sparkles),
  arrow: make(ArrowRight, 16),
  refresh: make(RefreshCw, 16),
  loader: make(LoaderCircle, 16),
  clock: make(Clock, 13),
  tag: make(Tag, 13),
  chevron: make(ChevronRight, 16),
  flag: make(Flag, 14),
  x: make(X, 16),
  inbox: make(Inbox),
  chat: make(MessageSquare),
  send: make(SendHorizontal, 16),
};
