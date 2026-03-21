"use client";

import { useEffect, useState, useCallback, use } from "react";
import {
  Calendar,
  Clock,
  Cpu,
  Database,
  FileCode,
  Layers,
  RefreshCw,
  AlertCircle,
  Timer,
  Zap,
  Globe,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useConfig } from "@/components/ConfigProvider";
import { cfApiCall } from "@/hooks/useCFApi";
import type {
  CFWorkerScript,
  CFWorkerSettings,
  CFWorkerBinding,
  CFWorkerSchedule,
} from "@/lib/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";

// ─── Binding type icon ────────────────────────────────────────────────────────

function bindingIcon(type: string) {
  switch (type) {
    case "kv_namespace": return <Database className="h-3.5 w-3.5" />;
    case "r2_bucket": return <Layers className="h-3.5 w-3.5" />;
    case "d1": return <Database className="h-3.5 w-3.5" />;
    case "service": return <Globe className="h-3.5 w-3.5" />;
    case "ai": return <Cpu className="h-3.5 w-3.5" />;
    case "plain_text":
    case "secret_text": return <FileCode className="h-3.5 w-3.5" />;
    default: return <Zap className="h-3.5 w-3.5" />;
  }
}

function bindingDetail(b: CFWorkerBinding): string {
  if (b.type === "kv_namespace" && "namespace_id" in b) return `ID: ${b.namespace_id}`;
  if (b.type === "r2_bucket" && "bucket_name" in b) return b.bucket_name as string;
  if (b.type === "d1" && "id" in b) return `ID: ${b.id as string}`;
  if (b.type === "service" && "service" in b) {
    const svc = b as { type: string; name: string; service: string; environment?: string };
    return svc.environment ? `${svc.service} (${svc.environment})` : svc.service;
  }
  if (b.type === "plain_text" && "text" in b) return (b as { type: string; name: string; text: string }).text;
  if (b.type === "secret_text") return "••••••••";
  if (b.type === "analytics_engine" && "dataset" in b) return (b as { type: string; name: string; dataset: string }).dataset;
  if (b.type === "queue" && "queue_name" in b) return (b as { type: string; name: string; queue_name: string }).queue_name;
  return "—";
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-xs text-[var(--text-tertiary)] shrink-0">{label}</span>
      <span className="text-xs text-[var(--text-primary)] text-right font-mono">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkerOverviewPage({
  params,
}: {
  params: Promise<{ scriptName: string }>;
}) {
  const { config } = useConfig();
  const { scriptName } = use(params);
  const decodedName = decodeURIComponent(scriptName);

  const [meta, setMeta] = useState<CFWorkerScript | null>(null);
  const [settings, setSettings] = useState<CFWorkerSettings | null>(null);
  const [schedules, setSchedules] = useState<CFWorkerSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!config?.apiToken || !config?.accountId) return;
    setLoading(true);
    setError(null);

    const [listRes, settingsRes, schedulesRes] = await Promise.all([
      cfApiCall(config.apiToken, `/accounts/${config.accountId}/workers`),
      cfApiCall(config.apiToken, `/accounts/${config.accountId}/workers/${decodedName}/settings`),
      cfApiCall(config.apiToken, `/accounts/${config.accountId}/workers/${decodedName}/schedules`),
    ]);

    if (listRes.success && listRes.result) {
      const found = (listRes.result as CFWorkerScript[]).find((s) => s.id === decodedName);
      setMeta(found ?? null);
    }
    if (settingsRes.success && settingsRes.result) {
      setSettings(settingsRes.result as CFWorkerSettings);
    } else if (!listRes.success) {
      setError(listRes.errors?.[0]?.message ?? "Failed to load worker data");
    }
    if (schedulesRes.success && schedulesRes.result) {
      const r = schedulesRes.result as { schedules?: CFWorkerSchedule[] };
      setSchedules(r.schedules ?? []);
    }

    setLoading(false);
  }, [config, decodedName]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--badge-error-border)] bg-[var(--badge-error-bg)] p-4 text-[var(--color-error)]">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const bindings = settings?.bindings ?? [];
  const handlers = meta?.handlers ?? ["fetch"];

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={load}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="flex items-start gap-3 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cf-orange)]/10">
            <Calendar className="h-4 w-4 text-[var(--cf-orange)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Created</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
              {meta?.created_on ? formatDate(meta.created_on) : "—"}
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-info)]/10">
            <Clock className="h-4 w-4 text-[var(--color-info)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Modified</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
              {meta?.modified_on ? formatRelativeTime(meta.modified_on) : "—"}
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-success)]/10">
            <Cpu className="h-4 w-4 text-[var(--color-success)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Usage Model</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)] capitalize">
              {settings?.usage_model ?? meta?.usage_model ?? "—"}
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-warning)]/10">
            <FileCode className="h-4 w-4 text-[var(--color-warning)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Compat Date</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-[var(--text-primary)]">
              {settings?.compatibility_date ?? meta?.compatibility_date ?? "—"}
            </p>
          </div>
        </Card>
      </div>

      {/* Details + handlers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Configuration</h2>
          <InfoRow
            label="Placement"
            value={
              <span className="capitalize">
                {settings?.placement?.mode ?? meta?.placement?.mode ?? "off"}
              </span>
            }
          />
          <InfoRow
            label="Logpush"
            value={
              (settings?.logpush ?? meta?.logpush) ? (
                <Badge variant="success">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )
            }
          />
          <InfoRow
            label="Deployed via"
            value={meta?.last_deployed_from ?? "—"}
          />
          <InfoRow
            label="Compat flags"
            value={
              (settings?.compatibility_flags ?? meta?.compatibility_flags ?? []).length > 0
                ? (settings?.compatibility_flags ?? meta?.compatibility_flags ?? []).join(", ")
                : "—"
            }
          />
        </Card>

        {/* Handlers */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Entry Points</h2>
          {handlers.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">No handlers detected.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {handlers.map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
                >
                  <Zap className="h-3.5 w-3.5 text-[var(--cf-orange)]" />
                  <span className="font-mono text-xs font-medium text-[var(--text-primary)]">{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* Cron triggers */}
          {schedules.length > 0 && (
            <>
              <h2 className="mb-3 mt-5 text-sm font-semibold text-[var(--text-primary)]">
                Cron Triggers
              </h2>
              <div className="flex flex-col gap-2">
                {schedules.map((s) => (
                  <div
                    key={s.cron}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
                  >
                    <Timer className="h-3.5 w-3.5 text-[var(--color-info)]" />
                    <span className="font-mono text-xs font-medium text-[var(--text-primary)]">{s.cron}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Bindings */}
      <Card padding="none">
        <div className="border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Bindings</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {bindings.length} binding{bindings.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          {bindings.length > 0 && (
            <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
          )}
        </div>
        {bindings.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-xs text-[var(--text-tertiary)]">No bindings configured.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  Variable
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  Type
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] hidden md:table-cell">
                  Value / ID
                </th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((b, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs font-medium text-[var(--text-primary)]">
                    {b.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      {bindingIcon(b.type)}
                      {b.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--text-tertiary)] hidden md:table-cell">
                    {bindingDetail(b)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
