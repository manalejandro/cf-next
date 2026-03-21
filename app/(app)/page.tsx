"use client";

import { useEffect, useState, useCallback } from "react";
import { Globe, Shield, Wifi, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfig } from "@/components/ConfigProvider";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFZone, CFListResponse } from "@/lib/types";
import { formatRelativeTime, zoneStatusColor } from "@/lib/utils";

export default function DashboardPage() {
  const { config } = useConfig();
  const [zones, setZones] = useState<CFZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!config?.apiToken) return;
    setLoading(true);
    setError(null);
    const res = await cfApiCall(config.apiToken, "/zones?per_page=20");
    if (res.success && res.result) {
      setZones(res.result as CFZone[]);
    } else {
      setError(res.errors?.[0]?.message ?? "Failed to load zones");
    }
    setLoading(false);
  }, [config]);

  useEffect(() => { load(); }, [load]);

  const activeZones = zones.filter((z) => z.status === "active");
  const pendingZones = zones.filter((z) => z.status === "pending");
  const pausedZones = zones.filter((z) => z.paused);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={config?.accountName ? `Account: ${config.accountName}` : "Overview of your Cloudflare infrastructure"}
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
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-error)]/30 bg-[#3d1a1a]/30 px-4 py-3 text-sm text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Zones"
          value={loading ? "—" : zones.length}
          icon={<Globe className="h-5 w-5" />}
          accent
        />
        <StatCard
          title="Active"
          value={loading ? "—" : activeZones.length}
          icon={<Wifi className="h-5 w-5" />}
          subtitle="Fully activated"
        />
        <StatCard
          title="Pending"
          value={loading ? "—" : pendingZones.length}
          icon={<AlertCircle className="h-5 w-5" />}
          subtitle="Awaiting activation"
        />
        <StatCard
          title="Protected"
          value={loading ? "—" : zones.filter((z) => !z.paused).length}
          icon={<Shield className="h-5 w-5" />}
          subtitle="Proxy enabled"
        />
      </div>

      {/* Recent zones */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Zones</h2>
        <Link href="/zones">
          <Button variant="ghost" size="sm">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-6 py-12 text-center">
          <Globe className="mx-auto mb-3 h-8 w-8 text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No zones found</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Add a domain to your Cloudflare account to get started.</p>
          <Link href="/zones" className="mt-4 inline-block">
            <Button variant="primary" size="sm">Manage Zones</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {zones.slice(0, 8).map((zone) => (
            <Link
              key={zone.id}
              href={`/zones/${zone.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)] hover:border-[var(--cf-orange)]/30 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-overlay)]">
                  <Globe className="h-4 w-4 text-[var(--cf-orange)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{zone.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {zone.plan?.name ?? "Unknown plan"} · {formatRelativeTime(zone.modified_on)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {zone.paused && <Badge variant="warning">Paused</Badge>}
                <Badge variant={zoneStatusColor(zone.status) as "success" | "warning" | "error" | "info" | "secondary"} dot>
                  {zone.status}
                </Badge>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
