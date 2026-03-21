"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Search, Trash2, Edit2, AlertCircle, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFDNSRecord, DNSRecordType } from "@/lib/types";
import { ttlLabel, formatRelativeTime } from "@/lib/utils";

const RECORD_TYPES: DNSRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "HTTPS", "PTR"];

const TTL_OPTIONS = [
  { value: "1", label: "Auto" },
  { value: "60", label: "1 minute" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "1 day" },
];

interface RecordFormData {
  type: DNSRecordType;
  name: string;
  content: string;
  ttl: string;
  proxied: boolean;
  priority: string;
  comment: string;
}

const DEFAULT_FORM: RecordFormData = {
  type: "A",
  name: "",
  content: "",
  ttl: "1",
  proxied: false,
  priority: "",
  comment: "",
};

function RecordModal({
  open,
  onClose,
  onSaved,
  token,
  zoneId,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
  zoneId: string;
  existing?: CFDNSRecord;
}) {
  const toast = useToast();
  const [form, setForm] = useState<RecordFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existing) {
      setForm({
        type: existing.type,
        name: existing.name,
        content: existing.content,
        ttl: String(existing.ttl ?? 1),
        proxied: existing.proxied,
        priority: existing.priority != null ? String(existing.priority) : "",
        comment: existing.comment ?? "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError("");
  }, [existing, open]);

  const set = (field: keyof RecordFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.content) { setError("Name and content are required"); return; }
    setLoading(true);
    setError("");

    const payload: Record<string, unknown> = {
      type: form.type,
      name: form.name,
      content: form.content,
      ttl: parseInt(form.ttl, 10),
      proxied: form.proxied,
    };
    if (form.comment) payload.comment = form.comment;
    if (form.priority) payload.priority = parseInt(form.priority, 10);

    let res;
    if (existing) {
      res = await cfApiCall(token, `/zones/${zoneId}/dns/${existing.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      res = await cfApiCall(token, `/zones/${zoneId}/dns`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    setLoading(false);
    if (res.success) {
      toast.success(existing ? "Record updated" : "Record created");
      onClose();
      onSaved();
    } else {
      setError(res.errors?.[0]?.message ?? "Failed to save record");
    }
  }

  const proxiable = ["A", "AAAA", "CNAME"].includes(form.type);
  const hasPriority = ["MX", "SRV"].includes(form.type);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit DNS Record" : "Add DNS Record"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {existing ? "Save Changes" : "Add Record"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => set("type", e.target.value as DNSRecordType)}
            options={RECORD_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Input
            label="Name"
            placeholder="@ or subdomain"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <Input
          label="Content"
          placeholder={form.type === "A" ? "IPv4 address" : form.type === "AAAA" ? "IPv6 address" : form.type === "MX" ? "mail.example.com" : "Value"}
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="TTL"
            value={form.ttl}
            onChange={(e) => set("ttl", e.target.value)}
            options={TTL_OPTIONS}
            disabled={form.proxied}
          />
          {hasPriority && (
            <Input
              label="Priority"
              type="number"
              placeholder="10"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            />
          )}
        </div>
        {proxiable && (
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.proxied}
                onChange={(e) => set("proxied", e.target.checked)}
              />
              <div className={`h-5 w-9 rounded-full transition-colors ${form.proxied ? "bg-[var(--cf-orange)]" : "bg-[var(--bg-overlay)]"}`} />
              <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${form.proxied ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">
              Proxied through Cloudflare {form.proxied && <span className="text-[var(--cf-orange)]">(enabled)</span>}
            </span>
          </label>
        )}
        <Input
          label="Comment (optional)"
          placeholder="Add a note about this record"
          value={form.comment}
          onChange={(e) => set("comment", e.target.value)}
        />
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--color-error)]">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default function DNSPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const { config } = useConfig();
  const toast = useToast();
  const [zoneId, setZoneId] = useState("");
  const [records, setRecords] = useState<CFDNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CFDNSRecord | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CFDNSRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { params.then((p) => setZoneId(p.zoneId)); }, [params]);

  const load = useCallback(async () => {
    if (!config?.apiToken || !zoneId) return;
    setLoading(true);
    // Paginate through all pages (CF max is 100/page)
    const all: CFDNSRecord[] = [];
    let page = 1;
    while (true) {
      const res = await cfApiCall(config.apiToken, `/zones/${zoneId}/dns?per_page=100&page=${page}`);
      if (!res.success) break;
      const batch = (res.result as CFDNSRecord[]) ?? [];
      all.push(...batch);
      const info = res.result_info as { total_pages?: number; page?: number } | undefined;
      if (!info || page >= (info.total_pages ?? 1)) break;
      page++;
    }
    setRecords(all);
    setLoading(false);
  }, [config, zoneId]);

  useEffect(() => { if (zoneId) load(); }, [zoneId, load]);

  async function handleDelete() {
    if (!deleteTarget || !config?.apiToken) return;
    setDeleting(true);
    const res = await cfApiCall(config.apiToken, `/zones/${zoneId}/dns/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.success) {
      toast.success("Record deleted");
      setDeleteTarget(null);
      load();
    } else {
      toast.error(res.errors?.[0]?.message ?? "Failed to delete record");
    }
  }

  function openEdit(record: CFDNSRecord) {
    setEditing(record);
    setShowModal(true);
  }

  function openCreate() {
    setEditing(undefined);
    setShowModal(true);
  }

  const filtered = records.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const recordTypes = [...new Set(records.map((r) => r.type))].sort();

  return (
    <div>
      <PageHeader
        title="DNS Records"
        description={`${records.length} record${records.length !== 1 ? "s" : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              Add Record
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search records…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--cf-orange)] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setTypeFilter("")}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${!typeFilter ? "border-[var(--cf-orange)] bg-[var(--cf-orange)]/10 text-[var(--cf-orange)]" : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--border)]"}`}
          >
            All
          </button>
          {recordTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t === typeFilter ? "" : t)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${typeFilter === t ? "border-[var(--cf-orange)] bg-[var(--cf-orange)]/10 text-[var(--cf-orange)]" : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--border)]"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Table
        loading={loading}
        data={filtered}
        keyExtractor={(r) => r.id}
        empty={
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">No DNS records</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">Add your first DNS record to get started.</p>
          </div>
        }
        columns={[
          {
            key: "type",
            header: "Type",
            width: "80px",
            cell: (r) => (
              <Badge variant="secondary" size="sm">
                <code>{r.type}</code>
              </Badge>
            ),
          },
          {
            key: "name",
            header: "Name",
            cell: (r) => (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-[var(--text-primary)] max-w-[200px] truncate">{r.name}</span>
                {r.proxied && (
                  <span title="Proxied">
                    <Shield className="h-3 w-3 text-[var(--cf-orange)]" />
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "content",
            header: "Content",
            cell: (r) => (
              <span className="font-mono text-xs text-[var(--text-secondary)] max-w-[240px] truncate block">{r.content}</span>
            ),
          },
          {
            key: "ttl",
            header: "TTL",
            width: "80px",
            cell: (r) => (
              <span className="text-xs text-[var(--text-tertiary)]">{r.proxied ? "Auto" : ttlLabel(r.ttl)}</span>
            ),
          },
          {
            key: "modified",
            header: "Modified",
            width: "100px",
            cell: (r) => (
              <span className="text-xs text-[var(--text-tertiary)]">{formatRelativeTime(r.modified_on)}</span>
            ),
          },
          {
            key: "actions",
            header: "",
            width: "80px",
            cell: (r) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(r)}
                  className="rounded p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(r)}
                  className="rounded p-1.5 text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-[#3d1a1a]/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ]}
      />

      <RecordModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditing(undefined); }}
        onSaved={load}
        token={config?.apiToken ?? ""}
        zoneId={zoneId}
        existing={editing}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete DNS Record"
        description={`Delete the ${deleteTarget?.type} record for "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
