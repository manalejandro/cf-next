"use client";

import { useEffect, useState } from "react";
import { Globe, CheckCircle, AlertCircle, RefreshCw, Trash2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/Modal";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFZone } from "@/lib/types";
import { formatDate, zoneStatusColor } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ZoneOverviewPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const { config } = useConfig();
  const toast = useToast();
  const router = useRouter();
  const [zone, setZone] = useState<CFZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoneId, setZoneId] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);

  useEffect(() => {
    params.then(async (p) => {
      setZoneId(p.zoneId);
      if (!config?.apiToken) return;
      setLoading(true);
      const res = await cfApiCall(config.apiToken, `/zones/${p.zoneId}`);
      if (res.success && res.result) setZone(res.result as CFZone);
      setLoading(false);
    });
  }, [params, config]);

  async function purgeCache() {
    if (!config?.apiToken || !zoneId) return;
    setPurgingCache(true);
    const res = await cfApiCall(config.apiToken, `/zones/${zoneId}/purge`, {
      method: "POST",
      body: JSON.stringify({ purge_everything: true }),
    });
    setPurgingCache(false);
    if (res.success) toast.success("Cache purged successfully");
    else toast.error(res.errors?.[0]?.message ?? "Failed to purge cache");
  }

  async function handleDelete() {
    if (!config?.apiToken || !zoneId) return;
    setDeleting(true);
    const res = await cfApiCall(config.apiToken, `/zones/${zoneId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.success) {
      toast.success("Zone deleted");
      router.push("/zones");
    } else {
      toast.error(res.errors?.[0]?.message ?? "Failed to delete zone");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.info("Copied to clipboard"));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--bg-surface)]" />
        ))}
      </div>
    );
  }

  if (!zone) return <p className="text-[var(--text-secondary)]">Zone not found.</p>;

  const statusColor = zoneStatusColor(zone.status);

  return (
    <div className="space-y-6">
      {/* Status + Actions */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Status</p>
              <Badge
                variant={statusColor as "success" | "warning" | "error" | "info" | "secondary"}
                size="md"
                dot
              >
                {zone.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Plan</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{zone.plan?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Proxy</p>
              <Badge variant={zone.paused ? "warning" : "success"} size="md">
                {zone.paused ? "Paused" : "Active"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Type</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{zone.type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              loading={purgingCache}
              onClick={purgeCache}
            >
              Purge Cache
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setShowDelete(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Details grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Zone info */}
        <Card>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Zone Information</h3>
          <dl className="space-y-3">
            {[
              { label: "Zone ID", value: zone.id, copy: true },
              { label: "Domain", value: zone.name },
              { label: "Account", value: zone.account?.name ?? zone.account?.id ?? "—" },
              { label: "Created", value: formatDate(zone.created_on) },
              { label: "Activated", value: zone.activated_on ? formatDate(zone.activated_on) : "Not yet" },
              { label: "Modified", value: formatDate(zone.modified_on) },
            ].map(({ label, value, copy }) => (
              <div key={label} className="flex justify-between gap-2 text-sm">
                <dt className="text-[var(--text-tertiary)] shrink-0">{label}</dt>
                <dd className="flex items-center gap-1 text-[var(--text-primary)] text-right font-mono text-xs">
                  {copy ? <span className="max-w-[180px] truncate">{value}</span> : value}
                  {copy && (
                    <button
                      onClick={() => copyToClipboard(value)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--cf-orange)] transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Name servers */}
        <Card>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Cloudflare Name Servers</h3>
          {zone.status !== "active" && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-[#3d2d0a]/30 border border-[var(--color-warning)]/20 px-3 py-2.5 text-xs text-[var(--color-warning)]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Update your domain registrar to use these name servers to activate this zone.</span>
            </div>
          )}
          <ul className="space-y-2">
            {zone.name_servers.map((ns) => (
              <li key={ns} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
                <code className="text-xs text-[var(--cf-orange)]">{ns}</code>
                <button
                  onClick={() => copyToClipboard(ns)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--cf-orange)] transition-colors"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>

          {zone.original_name_servers && zone.original_name_servers.length > 0 && (
            <>
              <h4 className="mt-4 mb-2 text-xs font-medium text-[var(--text-tertiary)]">Original Name Servers</h4>
              <ul className="space-y-1">
                {zone.original_name_servers.map((ns) => (
                  <li key={ns} className="text-xs text-[var(--text-tertiary)] px-2">{ns}</li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Zone"
        description={`Are you sure you want to delete ${zone.name}? This will remove all DNS records and cannot be undone.`}
        confirmLabel="Delete Zone"
      />
    </div>
  );
}
