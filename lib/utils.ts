import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Priority, Column } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 2;
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  urgent: { label: "Urgent", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
  high: { label: "High", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  low: { label: "Low", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-400" },
};

export const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "To Do", color: "text-slate-600", dotColor: "bg-slate-400", headerBg: "bg-white/75" },
  { id: "inprogress", title: "In Progress", color: "text-sky-700", dotColor: "bg-sky-500", headerBg: "bg-sky-50/70" },
  { id: "review", title: "Review", color: "text-amber-700", dotColor: "bg-amber-500", headerBg: "bg-amber-50/70" },
  { id: "done", title: "Done", color: "text-emerald-700", dotColor: "bg-emerald-500", headerBg: "bg-emerald-50/70" },
];

const COLUMN_THEMES: Omit<Column, "id" | "title">[] = [
  { color: "text-sky-700", dotColor: "bg-sky-500", headerBg: "bg-sky-50/70" },
  { color: "text-amber-700", dotColor: "bg-amber-500", headerBg: "bg-amber-50/70" },
  { color: "text-emerald-700", dotColor: "bg-emerald-500", headerBg: "bg-emerald-50/70" },
  { color: "text-rose-700", dotColor: "bg-rose-500", headerBg: "bg-rose-50/70" },
  { color: "text-violet-700", dotColor: "bg-violet-500", headerBg: "bg-violet-50/70" },
  { color: "text-cyan-700", dotColor: "bg-cyan-500", headerBg: "bg-cyan-50/70" },
];

export function getColumnTheme(index: number) {
  return COLUMN_THEMES[index % COLUMN_THEMES.length];
}

export function getChecklistProgress(checklist: { done: boolean }[]): number {
  if (checklist.length === 0) return 0;
  return Math.round((checklist.filter((i) => i.done).length / checklist.length) * 100);
}

export function optimizeAvatarUrl(url: string | null | undefined, size = 64): string | null {
  if (!url) return null;

  // Google avatars support size suffixes like "=s96-c"; requesting smaller sizes improves first paint.
  if (url.includes("googleusercontent.com")) {
    const normalized = url.replace(/=s\d+-c$/, `=s${size}-c`);
    if (normalized !== url) return normalized;
    return `${url}=s${size}-c`;
  }

  return url;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
