"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Cpu,
  RefreshCw,
  Search,
  ChevronRight,
  AlertCircle,
  Clock,
  Calendar,
  Globe,
  Mail,
  MessageSquare,
  Bell,
  Zap,
  Radio,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useConfig } from "@/components/ConfigProvider";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFWorkerScript } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

// ─── Handler config ───────────────────────────────────────────────────────────

const HANDLER_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  fetch:     { label: "fetch",     icon: Globe,         color: "text-[var(--cf-orange)]    bg-[var(--badge-orange-bg)]   border-[var(--badge-orange-border)]" },
  scheduled: { label: "cron",      icon: Clock,         color: "text-[var(--color-info)]   bg-[var(--badge-info-bg)]    border-[var(--badge-info-border)]" },
  email:     { label: "email",     icon: Mail,          color: "text-[var(--color-success)] bg-[var(--badge-success-bg)] border-[var(--badge-success-border)]" },
  queue:     { label: "queue",     icon: MessageSquare, color: "text-purple-400             bg-purple-900/20              border-purple-800/40" },
  alarm:     { label: "alarm",     icon: Bell,          color: "text-[var(--color-warning)] bg-[var(--badge-warning-bg)] border-[var(--badge-warning-border)]" },
  rpc:       { label: "rpc",       icon: Radio,         color: "text-[var(--color-info)]   bg-[var(--badge-info-bg)]    border-[var(--badge-info-border)]" },
  tail:      { label: "tail",      icon: Zap,           color: "text-[var(--text-tertiary)] bg-[var(--bg-overlay)]       border-[var(--border-subtle)]" },
};

function HandlerBadge({ handler }: { handler: string }) {
  const cfg = HANDLER_CONFIG[handler] ?? {
    label: handler,
    icon: Zap,
    color: "text-[var(--text-tertiary)] bg-[var(--bg-overlay)] border-[var(--border-subtle)]",
  };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium ${cfg.color}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Usage model badge ────────────────────────────────────────────────────────

const USAGE_COLORS: Record<string, string> = {
  standard: "text-[var(--color-success)] bg-[var(--badge-success-bg)] border-[var(--badge-success-border)]",
  bundled:  "text-[var(--color-info)]    bg-[var(--badge-info-bg)]    border-[var(--badge-info-border)]",
  unbound:  "text-[var(--color-warning)] bg-[var(--badge-warning-bg)] border-[var(--badge-warning-border)]",
};

function UsageBadge({ model }: { model?: string }) {
  if (!model) return <span className="text-[var(--text-tertiary)] text-xs">—</span>;
  const classes =
    USAGE_COLORS[model] ??
    "text-[var(--text-secondary)] bg-[var(--bg-overlay)] border-[var(--border)]";
  return (
    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${classes}`}>
      {model}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkersPage() {
  const { config } = useConfig();
  const [scripts, setScripts] = useState<CFWorkerScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!config?.apiToken || !config?.accountId) return;
    setLoading(true);
    setError(null);
    const res = await cfApiCall(config.apiToken, `/accounts/${config.accountId}/workers`);
    if (res.success && res.result) {
      setScripts(
        (res.result as CFWorkerScript[]).sort((a, b) =>
          b.modified_on.localeCompare(a.modified_on)
        )
      );
    } else {
      setError(res.errors?.[0]?.message ?? "Failed to load workers");
    }
    setLoading(false);
  }, [config]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = scripts.filter(
    (s) => !search || s.id.toLowerCase().includes(search.toLowerCase())
  );

  if (!config?.accountId) {
    return (
      <div>
        <PageHeader title="Workers" description="Manage your Cloudflare Workers" />
        <Card className="mt-4 flex items-center gap-3 text-[var(--color-warning)]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            No account configured. Go to{" "}
            <Link href="/settings" className="underline">
              Settings
            </Link>{" "}
            and add an Account ID.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Workers"
        description={
          loading
            ? "Loading…"
            : `${scripts.length} deployed worker${scripts.length !== 1 ? "s" : ""}`
        }
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={load}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--badge-error-border)] bg-[var(--badge-error-bg)] p-4 text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input
            className="pl-9"
            placeholder="Search workers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <Cpu className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            {search ? "No workers match your search." : "No workers found in this account."}
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Worker
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hidden md:block w-40">
              Handlers
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hidden md:block w-20 text-center">
              Model
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hidden lg:block w-24 text-right">
              Created
            </span>
            <span className="w-5" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((script) => {
              const handlers = script.handlers ?? ["fetch"];
              return (
                <Link
                  key={script.id}
                  href={`/workers/${encodeURIComponent(script.id)}`}
                  className="group grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {/* Name + meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--cf-orange)] transition-colors truncate">
                        {script.id}
                      </span>
                      {script.compatibility_date && (
                        <span className="hidden sm:inline-flex rounded border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-tertiary)]">
                          {script.compatibility_date}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(script.modified_on)}
                      </span>
                      {script.logpush && (
                        <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-1 py-0 text-[9px]">
                          logpush
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Handlers */}
                  <div className="hidden md:flex flex-wrap gap-1 w-40">
                    {handlers.slice(0, 3).map((h) => (
                      <HandlerBadge key={h} handler={h} />
                    ))}
                    {handlers.length > 3 && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        +{handlers.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Usage model */}
                  <div className="hidden md:flex w-20 justify-center">
                    <UsageBadge model={script.usage_model} />
                  </div>

                  {/* Created */}
                  <div className="hidden lg:flex w-24 justify-end items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span title={script.created_on}>{formatRelativeTime(script.created_on)}</span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--cf-orange)] transition-colors shrink-0 w-5" />
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-[10px] text-[var(--text-tertiary)]">
            {filtered.length} of {scripts.length} worker{scripts.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
