"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  RefreshCw,
  Calendar,
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  BarChart2,
  Shield,
  Wifi,
  Eye,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useConfig } from "@/components/ConfigProvider";
import { cfApiCall } from "@/hooks/useCFApi";
import { formatBytes, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { CFZone, CFAuditLog, CFAnalyticsTotals } from "@/lib/types";

// ─── Tab type ────────────────────────────────────────────────────────────────

type Tab = "audit" | "analytics";

// ─── Time ranges ─────────────────────────────────────────────────────────────

const TIME_RANGES = [
  { label: "1 hour", minutes: 60 },
  { label: "24 hours", minutes: 1440 },
  { label: "7 days", minutes: 10080 },
  { label: "30 days", minutes: 43200 },
];

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "orange",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: "orange" | "success" | "info" | "warning" | "error";
}) {
  const colorMap: Record<string, string> = {
    orange: "var(--cf-orange)",
    success: "var(--color-success)",
    info: "var(--color-info)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
  };
  const c = colorMap[color] ?? colorMap.orange;

  return (
    <Card className="flex items-start gap-4 p-5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${c} 12%, transparent)` }}
      >
        <Icon className="h-5 w-5" style={{ color: c }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-[var(--text-primary)]">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Audit Log tab ────────────────────────────────────────────────────────────

function AuditLogTab({ token, accountId }: { token: string; accountId: string }) {
  const [logs, setLogs] = useState<CFAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const PER_PAGE = 25;

  const load = useCallback(async (p = 1) => {
    if (!token || !accountId) {
      setError("Account ID not configured. Please set it in Settings.");
      return;
    }
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({
      per_page: String(PER_PAGE),
      page: String(p),
      direction: "desc",
    });
    if (actionFilter) qs.set("action.type", actionFilter);

    const res = await cfApiCall(token, `/accounts/${accountId}/audit_logs?${qs}`);
    setLoading(false);

    if (!res.success) {
      setError(res.errors?.[0]?.message ?? "Failed to load audit logs");
      return;
    }

    const result = res.result as CFAuditLog[] | null;
    const info = res.result_info as { total_pages?: number; page?: number } | undefined;
    setLogs(result ?? []);
    setTotalPages(info?.total_pages ?? 1);
    setPage(p);
  }, [token, accountId, actionFilter]);

  useEffect(() => { load(1); }, [load]);

  const ACTION_TYPES = [
    "", "add", "delete", "modify", "purge_cache", "create", "disable", "enable",
    "login", "logout", "rotate",
  ];

  function actionBadgeVariant(type: string): "success" | "error" | "warning" | "info" | "secondary" {
    if (["add", "create", "enable"].includes(type)) return "success";
    if (["delete", "disable"].includes(type)) return "error";
    if (["modify", "purge_cache", "rotate"].includes(type)) return "warning";
    if (["login"].includes(type)) return "info";
    return "secondary";
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <span className="text-xs text-[var(--text-tertiary)]">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--cf-orange)] focus:outline-none"
          >
            {ACTION_TYPES.map((t) => (
              <option key={t} value={t}>{t || "All actions"}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => load(page)}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--badge-error-bg)] px-4 py-3 text-sm text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && logs.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--bg-surface)]" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Activity className="mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No audit log entries</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Audit logs will appear here as you make changes to your Cloudflare account.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-tertiary)]">Time</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-tertiary)]">Action</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-tertiary)]">Resource</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-tertiary)]">Zone</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-tertiary)]">Actor</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-tertiary)]">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {logs.map((log) => (
                <tr key={log.id} className="bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-tertiary)]">
                    {formatRelativeTime(log.when)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={actionBadgeVariant(log.action.type)} size="sm">
                      {log.action.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    <span className="font-medium">{log.resource.type}</span>
                    {log.resource.id && (
                      <span className="ml-1 font-mono text-[var(--text-tertiary)] text-[10px]">
                        {log.resource.id.slice(0, 12)}&hellip;
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {log.zone?.name ?? <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {log.actor.email || log.actor.type}
                  </td>
                  <td className="px-4 py-3">
                    {log.action.result ? (
                      <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[var(--color-error)]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => load(page - 1)} disabled={page <= 1 || loading}>
              Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={() => load(page + 1)} disabled={page >= totalPages || loading}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ token, zones }: { token: string; zones: CFZone[] }) {
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [timeRange, setTimeRange] = useState(1440); // 24h default
  const [data, setData] = useState<CFAnalyticsTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first zone
  useEffect(() => {
    if (zones.length > 0 && !selectedZone) setSelectedZone(zones[0].id);
  }, [zones, selectedZone]);

  const load = useCallback(async () => {
    if (!token || !selectedZone) return;
    setLoading(true);
    setError(null);

    const until = new Date().toISOString();
    const since = new Date(Date.now() - timeRange * 60 * 1000).toISOString();

    const res = await cfApiCall(token, `/zones/${selectedZone}/analytics?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`);
    setLoading(false);

    if (!res.success) {
      setError(res.errors?.[0]?.message ?? "Failed to load analytics. HTTP request analytics may require a Pro or higher plan.");
      return;
    }

    const result = res.result as { totals?: CFAnalyticsTotals } | null;
    setData(result?.totals ?? null);
  }, [token, selectedZone, timeRange]);

  useEffect(() => { load(); }, [load]);

  const selectedZoneName = zones.find((z) => z.id === selectedZone)?.name ?? "";

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--cf-orange)] focus:outline-none"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {TIME_RANGES.map(({ label, minutes }) => (
              <button
                key={minutes}
                onClick={() => setTimeRange(minutes)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  timeRange === minutes
                    ? "bg-[var(--cf-orange)] text-white font-medium"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--badge-error-bg)] px-4 py-3 text-sm text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          {/* Metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              label="Total Requests"
              value={formatNumber(data.requests.all)}
              sub={`${formatNumber(data.requests.cached)} cached`}
              icon={TrendingUp}
              color="orange"
            />
            <StatCard
              label="Bandwidth Served"
              value={formatBytes(data.bandwidth.all)}
              sub={`${formatBytes(data.bandwidth.cached)} cached`}
              icon={Wifi}
              color="info"
            />
            <StatCard
              label="Threats Blocked"
              value={formatNumber(data.threats.all)}
              icon={Shield}
              color="error"
            />
            <StatCard
              label="Unique Visitors"
              value={formatNumber(data.uniques.all)}
              icon={Eye}
              color="success"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cache hit rate */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[var(--cf-orange)]" />
                Cache Performance
              </h3>
              {data.requests.all > 0 && (() => {
                const hitRate = Math.round((data.requests.cached / data.requests.all) * 100);
                return (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Cache Hit Rate</span>
                        <span className="font-medium text-[var(--color-success)]">{hitRate}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-success)] transition-all"
                          style={{ width: `${hitRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[var(--text-tertiary)]">Cached</p>
                        <p className="mt-0.5 font-semibold text-[var(--color-success)]">{formatNumber(data.requests.cached)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-tertiary)]">Uncached</p>
                        <p className="mt-0.5 font-semibold text-[var(--text-secondary)]">{formatNumber(data.requests.uncached)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>

            {/* HTTP status codes */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--cf-orange)]" />
                HTTP Status Codes — {selectedZoneName}
              </h3>
              {Object.entries(data.requests.http_status).length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">No data available for this period.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.requests.http_status)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([code, count]) => {
                      const total = data.requests.all || 1;
                      const pct = Math.round((count / total) * 100);
                      const codeN = parseInt(code, 10);
                      const barColor =
                        codeN < 300 ? "var(--color-success)" :
                        codeN < 400 ? "var(--color-info)" :
                        codeN < 500 ? "var(--color-warning)" :
                        "var(--color-error)";
                      return (
                        <div key={code}>
                          <div className="mb-0.5 flex items-center justify-between text-xs">
                            <span className="font-mono text-[var(--text-secondary)]">{code}</span>
                            <span className="text-[var(--text-tertiary)]">{formatNumber(count)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>

            {/* Top countries */}
            {Object.entries(data.requests.country).length > 0 && (
              <Card className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--cf-orange)]" />
                  Top Countries
                </h3>
                <div className="space-y-2">
                  {Object.entries(data.requests.country)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([country, count]) => {
                      const total = data.requests.all || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={country}>
                          <div className="mb-0.5 flex items-center justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">{country}</span>
                            <span className="text-[var(--text-tertiary)]">{formatNumber(count)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className="h-full rounded-full bg-[var(--cf-orange)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Content types */}
            {Object.entries(data.requests.content_type).length > 0 && (
              <Card className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[var(--cf-orange)]" />
                  Content Types
                </h3>
                <div className="space-y-2">
                  {Object.entries(data.requests.content_type)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([type, count]) => {
                      const total = data.requests.all || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={type}>
                          <div className="mb-0.5 flex items-center justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">{type}</span>
                            <span className="text-[var(--text-tertiary)]">{formatNumber(count)} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                            <div
                              className="h-full rounded-full bg-[var(--color-info)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const { config } = useConfig();
  const [tab, setTab] = useState<Tab>("audit");
  const [zones, setZones] = useState<CFZone[]>([]);

  useEffect(() => {
    if (!config?.apiToken) return;
    cfApiCall(config.apiToken, "/zones?per_page=50").then((res) => {
      if (res.success && res.result) setZones(res.result as CFZone[]);
    });
  }, [config]);

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "audit", label: "Audit Log", icon: Activity },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Audit log and traffic analytics across your zones"
      />

      {/* Tab bar */}
      <nav className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-[var(--cf-orange)] text-[var(--cf-orange)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>

      {!config?.apiToken ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">API token required</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Configure your Cloudflare API token in Settings to view activity.
          </p>
        </Card>
      ) : tab === "audit" ? (
        <AuditLogTab
          token={config.apiToken}
          accountId={config.accountId ?? ""}
        />
      ) : (
        <AnalyticsTab token={config.apiToken} zones={zones} />
      )}
    </div>
  );
}
