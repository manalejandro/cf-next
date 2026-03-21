"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Globe, Plus, RefreshCw, Search, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFZone } from "@/lib/types";
import { formatDate, zoneStatusColor } from "@/lib/utils";
import type { Metadata } from "next";

function AddZoneModal({
  open,
  onClose,
  onAdded,
  accountId,
  token,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  accountId?: string;
  token: string;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const res = await cfApiCall(token, "/zones", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), account: { id: accountId ?? "" }, jump_start: true }),
    });
    setLoading(false);
    if (res.success) {
      toast.success(`Zone ${name} added successfully`);
      setName("");
      onClose();
      onAdded();
    } else {
      setError(res.errors?.[0]?.message ?? "Failed to add zone");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Zone"
      description="Enter the domain name you want to add to Cloudflare."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit as unknown as React.MouseEventHandler}>Add Zone</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Domain name"
          placeholder="example.com"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />
      </form>
    </Modal>
  );
}

export default function ZonesPage() {
  const { config } = useConfig();
  const toast = useToast();
  const [zones, setZones] = useState<CFZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CFZone | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!config?.apiToken) return;
    setLoading(true);
    setError(null);
    const res = await cfApiCall(config.apiToken, "/zones?per_page=50");
    if (res.success && res.result) {
      setZones(res.result as CFZone[]);
    } else {
      setError(res.errors?.[0]?.message ?? "Failed to load zones");
    }
    setLoading(false);
  }, [config]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget || !config?.apiToken) return;
    setDeleting(true);
    const res = await cfApiCall(config.apiToken, `/zones/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.success) {
      toast.success(`Zone ${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      load();
    } else {
      toast.error(res.errors?.[0]?.message ?? "Failed to delete zone");
    }
  }

  const filtered = zones.filter((z) =>
    !search || z.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Zones"
        description="Manage your Cloudflare zones (domains)"
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={load}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setShowAdd(true)}
            >
              Add Zone
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search zones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--cf-orange)] focus:outline-none"
          />
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">{filtered.length} zone{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--color-error)]/30 bg-[#3d1a1a]/30 px-4 py-3 text-sm text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Zones grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-6 py-16 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {search ? "No zones match your search" : "No zones found"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {!search && "Add a domain to start managing it through Cloudflare."}
          </p>
          {!search && (
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" /> Add your first zone
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              onDelete={() => setDeleteTarget(zone)}
            />
          ))}
        </div>
      )}

      <AddZoneModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={load}
        accountId={config?.accountId}
        token={config?.apiToken ?? ""}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Zone"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone and will remove all associated DNS records and settings.`}
        confirmLabel="Delete Zone"
      />
    </div>
  );
}

function ZoneCard({ zone, onDelete }: { zone: CFZone; onDelete: () => void }) {
  const statusColor = zoneStatusColor(zone.status);

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-colors hover:border-[var(--cf-orange)]/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cf-orange)]/10">
            <Globe className="h-4.5 w-4.5 text-[var(--cf-orange)]" style={{ height: "18px", width: "18px" }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{zone.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{zone.plan?.name ?? "Free"}</p>
          </div>
        </div>
        <Badge
          variant={statusColor as "success" | "warning" | "error" | "info" | "secondary"}
          dot
        >
          {zone.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-[var(--text-tertiary)]">Type</span>
        <span className="text-[var(--text-secondary)]">{zone.type}</span>
        <span className="text-[var(--text-tertiary)]">Proxy</span>
        <span className={zone.paused ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}>
          {zone.paused ? "Paused" : "Active"}
        </span>
        <span className="text-[var(--text-tertiary)]">Modified</span>
        <span className="text-[var(--text-secondary)]">{formatDate(zone.modified_on)}</span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
        <Link
          href={`/zones/${zone.id}`}
          className="flex-1 text-center text-xs font-medium text-[var(--cf-orange)] hover:underline transition-colors"
        >
          Manage
        </Link>
        <div className="h-3 w-px bg-[var(--border)]" />
        <Link
          href={`/zones/${zone.id}/dns`}
          className="flex-1 text-center text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          DNS
        </Link>
        <div className="h-3 w-px bg-[var(--border)]" />
        <button
          onClick={onDelete}
          className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors"
          aria-label="Delete zone"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
