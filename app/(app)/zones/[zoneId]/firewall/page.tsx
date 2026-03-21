"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Shield, AlertTriangle, CheckCircle, XCircle, Ban, HelpCircle, Plus, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFFirewallRule, CFAccessRule } from "@/lib/types";
import { truncate, formatRelativeTime } from "@/lib/utils";

type FirewallAction = "block" | "challenge" | "js_challenge" | "managed_challenge" | "allow" | "log" | "bypass";

// ─── IP Access Rule Modal ─────────────────────────────────────────────────────

interface AccessRuleForm {
  target: "ip" | "ip_range" | "asn" | "country";
  value: string;
  mode: "block" | "challenge" | "js_challenge" | "managed_challenge" | "whitelist";
  notes: string;
}

const DEFAULT_ACCESS_FORM: AccessRuleForm = {
  target: "ip",
  value: "",
  mode: "block",
  notes: "",
};

const TARGET_PLACEHOLDERS: Record<AccessRuleForm["target"], string> = {
  ip: "1.2.3.4",
  ip_range: "1.2.3.0/24",
  asn: "AS12345",
  country: "US",
};

function AccessRuleModal({
  open,
  onClose,
  onSaved,
  token,
  zoneId,
  existing,
  deleteTarget,
  onDelete,
  deleting,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
  zoneId: string;
  existing?: CFAccessRule;
  deleteTarget: CFAccessRule | null;
  onDelete: () => void;
  deleting: boolean;
}) {
  const toast = useToast();
  const [form, setForm] = useState<AccessRuleForm>(DEFAULT_ACCESS_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        target: existing.configuration.target,
        value: existing.configuration.value,
        mode: existing.mode as AccessRuleForm["mode"],
        notes: existing.notes ?? "",
      });
    } else {
      setForm(DEFAULT_ACCESS_FORM);
    }
    setError("");
  }, [existing, open]);

  const set = (field: keyof AccessRuleForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.value.trim()) { setError("Value is required"); return; }
    setLoading(true);
    setError("");
    const payload = {
      mode: form.mode,
      configuration: { target: form.target, value: form.value.trim() },
      notes: form.notes,
    };
    const path = `/zones/${zoneId}/firewall/access_rules`;
    const res = existing
      ? await cfApiCall(token, `${path}`, { method: "POST", body: JSON.stringify(payload) }) // CF doesn't support PATCH on access rules, delete + recreate
      : await cfApiCall(token, path, { method: "POST", body: JSON.stringify(payload) });
    setLoading(false);
    if (res.success) {
      toast.success("Access rule created");
      onClose();
      onSaved();
    } else {
      setError(res.errors?.[0]?.message ?? "Failed to save access rule");
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={existing ? "Edit IP Access Rule" : "Add IP Access Rule"}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit as unknown as React.MouseEventHandler}>
              {existing ? "Save Changes" : "Add Rule"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Target Type"
              value={form.target}
              onChange={(e) => set("target", e.target.value)}
              options={[
                { value: "ip", label: "IP Address" },
                { value: "ip_range", label: "IP Range (CIDR)" },
                { value: "asn", label: "ASN" },
                { value: "country", label: "Country Code" },
              ]}
            />
            <Input
              label="Value"
              placeholder={TARGET_PLACEHOLDERS[form.target]}
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
            />
          </div>
          <Select
            label="Action"
            value={form.mode}
            onChange={(e) => set("mode", e.target.value)}
            options={[
              { value: "block", label: "Block" },
              { value: "challenge", label: "Challenge (CAPTCHA)" },
              { value: "js_challenge", label: "JS Challenge" },
              { value: "managed_challenge", label: "Managed Challenge" },
              { value: "whitelist", label: "Allow (Whitelist)" },
            ]}
          />
          <Input
            label="Notes (optional)"
            placeholder="e.g. Ban scrapers from AS12345"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--color-error)]">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
        </form>
      </Modal>
      <ConfirmModal
        open={showDeleteConfirm && deleteTarget !== null}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete Access Rule"
        description={`Remove the ${deleteTarget?.configuration.target} rule for "${deleteTarget?.configuration.value}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}

function actionBadge(action: string) {
  const map: Record<string, { variant: "success" | "error" | "warning" | "info" | "secondary" | "orange"; icon: React.ReactNode }> = {
    block: { variant: "error", icon: <Ban className="h-3 w-3" /> },
    allow: { variant: "success", icon: <CheckCircle className="h-3 w-3" /> },
    challenge: { variant: "warning", icon: <AlertTriangle className="h-3 w-3" /> },
    js_challenge: { variant: "warning", icon: <AlertTriangle className="h-3 w-3" /> },
    managed_challenge: { variant: "warning", icon: <Shield className="h-3 w-3" /> },
    log: { variant: "info", icon: <HelpCircle className="h-3 w-3" /> },
    bypass: { variant: "secondary", icon: <XCircle className="h-3 w-3" /> },
  };
  const { variant, icon } = map[action] ?? { variant: "secondary" as const, icon: null };
  return (
    <Badge variant={variant} size="sm">
      <span className="flex items-center gap-1">{icon}{action.replace(/_/g, " ")}</span>
    </Badge>
  );
}

export default function FirewallPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const { config } = useConfig();
  const toast = useToast();
  const [zoneId, setZoneId] = useState("");
  const [rules, setRules] = useState<CFFirewallRule[]>([]);
  const [accessRules, setAccessRules] = useState<CFAccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rules" | "access">("rules");
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CFAccessRule | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CFAccessRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { params.then((p) => setZoneId(p.zoneId)); }, [params]);

  const load = useCallback(async () => {
    if (!config?.apiToken || !zoneId) return;
    setLoading(true);
    const [rulesRes, accessRes] = await Promise.all([
      cfApiCall(config.apiToken, `/zones/${zoneId}/firewall?per_page=100`),
      cfApiCall(config.apiToken, `/zones/${zoneId}/firewall/access_rules?per_page=100`),
    ]);
    if (rulesRes.success && rulesRes.result) setRules(rulesRes.result as CFFirewallRule[]);
    if (accessRes.success && accessRes.result) setAccessRules(accessRes.result as CFAccessRule[]);
    setLoading(false);
  }, [config, zoneId]);

  useEffect(() => { if (zoneId) load(); }, [zoneId, load]);

  async function handleDeleteAccessRule() {
    if (!deleteTarget || !config?.apiToken) return;
    setDeleting(true);
    const res = await cfApiCall(config.apiToken, `/zones/${zoneId}/firewall/access_rules/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.success) {
      toast.success("Access rule deleted");
      setDeleteTarget(null);
      load();
    } else {
      toast.error(res.errors?.[0]?.message ?? "Failed to delete rule");
    }
  }

  function openCreate() {
    setEditingRule(undefined);
    setShowAccessModal(true);
  }

  return (
    <div>
      <PageHeader
        title="Firewall"
        description="Manage firewall rules and IP access rules for this zone"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              Add IP Rule
            </Button>
          </div>
        }
      />

      <AccessRuleModal
        open={showAccessModal}
        onClose={() => { setShowAccessModal(false); setEditingRule(undefined); }}
        onSaved={() => { setShowAccessModal(false); load(); }}
        token={config?.apiToken ?? ""}
        zoneId={zoneId}
        existing={editingRule}
        deleteTarget={deleteTarget}
        onDelete={handleDeleteAccessRule}
        deleting={deleting}
      />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Firewall Rules</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{loading ? "—" : rules.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Active Rules</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-success)]">{loading ? "—" : rules.filter((r) => !r.paused).length}</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">IP Access Rules</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{loading ? "—" : accessRules.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-[var(--border)]">
        {(["rules", "access"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-[var(--cf-orange)] text-[var(--cf-orange)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab === "rules" ? "Firewall Rules" : "IP Access Rules"}
          </button>
        ))}
      </div>

      {activeTab === "rules" ? (
        <Table
          loading={loading}
          data={rules}
          keyExtractor={(r) => r.id}
          empty={
            <div className="text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">No firewall rules configured</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Create rules in the Cloudflare dashboard to protect your zone.</p>
            </div>
          }
          columns={[
            {
              key: "description",
              header: "Description",
              cell: (r) => (
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{r.description || <span className="text-[var(--text-tertiary)] italic">No description</span>}</p>
                  {r.ref && <p className="text-xs text-[var(--text-tertiary)]">Ref: {r.ref}</p>}
                </div>
              ),
            },
            {
              key: "expression",
              header: "Expression",
              cell: (r) => (
                <code className="text-xs text-[var(--text-secondary)] max-w-[300px] truncate block font-mono">
                  {truncate(r.filter?.expression ?? "", 60)}
                </code>
              ),
            },
            {
              key: "action",
              header: "Action",
              width: "140px",
              cell: (r) => actionBadge(r.action),
            },
            {
              key: "status",
              header: "Status",
              width: "80px",
              cell: (r) => (
                <Badge variant={r.paused ? "secondary" : "success"} dot>
                  {r.paused ? "Paused" : "Active"}
                </Badge>
              ),
            },
          ]}
        />
      ) : (
        <Table
          loading={loading}
          data={accessRules}
          keyExtractor={(r) => r.id}
          empty={
            <div className="text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">No IP access rules</p>
            </div>
          }
          columns={[
            {
              key: "target",
              header: "Target",
              cell: (r) => (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.configuration?.target}</Badge>
                  <code className="text-xs font-mono text-[var(--text-primary)]">{r.configuration?.value}</code>
                </div>
              ),
            },
            {
              key: "mode",
              header: "Action",
              width: "160px",
              cell: (r) => actionBadge(r.mode),
            },
            {
              key: "notes",
              header: "Notes",
              cell: (r) => (
                <span className="text-xs text-[var(--text-secondary)]">{r.notes || "—"}</span>
              ),
            },
            {
              key: "modified",
              header: "Modified",
              width: "100px",
              cell: (r) => (
                <span className="text-xs text-[var(--text-tertiary)]">
                  {r.modified_on ? formatRelativeTime(r.modified_on) : "—"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              width: "80px",
              cell: (r) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => { setDeleteTarget(r); }}
                    className="rounded p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-colors"
                    title="Delete"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Delete confirm for access rules */}
      <ConfirmModal
        open={deleteTarget !== null && !showAccessModal}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAccessRule}
        loading={deleting}
        title="Delete Access Rule"
        description={`Remove the ${deleteTarget?.configuration?.target} rule for "${deleteTarget?.configuration?.value}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
