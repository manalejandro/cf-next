import type { ZoneStatus } from "./types";

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  const month = 2_592_000_000;
  const year = 31_536_000_000;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < month) return `${Math.floor(diff / day)}d ago`;
  if (diff < year) return `${Math.floor(diff / month)}mo ago`;
  return `${Math.floor(diff / year)}y ago`;
}

export function zoneStatusColor(status: ZoneStatus): string {
  switch (status) {
    case "active": return "success";
    case "pending": return "warning";
    case "initializing": return "info";
    case "moved":
    case "deleted":
    case "deactivated": return "error";
    default: return "secondary";
  }
}

export function ttlLabel(ttl: number): string {
  if (ttl === 1) return "Auto";
  if (ttl < 60) return `${ttl}s`;
  if (ttl < 3600) return `${Math.round(ttl / 60)}m`;
  if (ttl < 86400) return `${Math.round(ttl / 3600)}h`;
  return `${Math.round(ttl / 86400)}d`;
}

export function truncate(str: string, max = 40): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getConfigFromStorage(): { apiToken: string; accountId?: string; accountName?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cf_config");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConfigToStorage(config: { apiToken: string; accountId?: string; accountName?: string }): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cf_config", JSON.stringify(config));
}

export function clearConfigFromStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cf_config");
}
