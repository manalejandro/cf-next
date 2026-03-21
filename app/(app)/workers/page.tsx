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
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useConfig } from "@/components/ConfigProvider";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFWorkerScript } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const USAGE_MODEL_LABEL: Record<string, string> = {
  standard: "Standard",
  bundled: "Bundled",
  unbound: "Unbound",
};

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
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
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
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  Handlers
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] hidden md:table-cell">
                  Usage Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] hidden lg:table-cell">
                  Compat Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] hidden lg:table-cell">
                  Modified
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((script) => (
                <tr
                  key={script.id}
                  className="group border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/workers/${encodeURIComponent(script.id)}`}
                      className="font-mono text-xs font-medium text-[var(--text-primary)] hover:text-[var(--cf-orange)] transition-colors"
                    >
                      {script.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(script.handlers ?? ["fetch"]).map((h) => (
                        <span
                          key={h}
                          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)] hidden md:table-cell">
                    {USAGE_MODEL_LABEL[script.usage_model ?? ""] ?? script.usage_model ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)] hidden lg:table-cell">
                    {script.compatibility_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-tertiary)] hidden lg:table-cell">
                    <span title={script.modified_on} className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(script.modified_on)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/workers/${encodeURIComponent(script.id)}`}>
                      <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
