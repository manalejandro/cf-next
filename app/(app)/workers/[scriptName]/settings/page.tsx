"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Globe,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/Modal";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFWorkerSettings, CFWorkerDomain, WorkerUsageModel, WorkerPlacementMode } from "@/lib/types";

export default function WorkerSettingsPage({
  params,
}: {
  params: Promise<{ scriptName: string }>;
}) {
  const { config } = useConfig();
  const toast = useToast();
  const { scriptName } = use(params);
  const decodedName = decodeURIComponent(scriptName);

  const router = useRouter();

  const [settings, setSettings] = useState<CFWorkerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [domains, setDomains] = useState<CFWorkerDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [compatDate, setCompatDate] = useState("");
  const [usageModel, setUsageModel] = useState<WorkerUsageModel>("standard");
  const [placement, setPlacement] = useState<WorkerPlacementMode>("off");
  const [logpush, setLogpush] = useState(false);

  const loadDomains = useCallback(async () => {
    if (!config?.apiToken || !config?.accountId) return;
    setDomainsLoading(true);
    const res = await cfApiCall(
      config.apiToken,
      `/accounts/${config.accountId}/workers/domains?service=${encodeURIComponent(decodedName)}`
    );
    if (res.success) setDomains((res.result as CFWorkerDomain[]) ?? []);
    setDomainsLoading(false);
  }, [config, decodedName]);

  const load = useCallback(async () => {
    if (!config?.apiToken || !config?.accountId) return;
    setLoading(true);
    setError(null);
    const res = await cfApiCall(
      config.apiToken,
      `/accounts/${config.accountId}/workers/${decodedName}/settings`
    );
    if (res.success && res.result) {
      const s = res.result as CFWorkerSettings;
      setSettings(s);
      setCompatDate(s.compatibility_date ?? "");
      setUsageModel(s.usage_model ?? "standard");
      setPlacement(s.placement?.mode ?? "off");
      setLogpush(s.logpush ?? false);
    } else {
      setError(res.errors?.[0]?.message ?? "Failed to load settings");
    }
    setLoading(false);
  }, [config, decodedName]);

  useEffect(() => {
    load();
    loadDomains();
  }, [load, loadDomains]);

  async function handleDelete() {
    if (!config?.apiToken || !config?.accountId) return;
    setDeleting(true);
    const res = await cfApiCall(
      config.apiToken,
      `/accounts/${config.accountId}/workers/scripts/${decodedName}`,
      { method: "DELETE" }
    );
    setDeleting(false);
    if (res.success) {
      toast.success(`Worker "${decodedName}" deleted`);
      router.push("/workers");
    } else {
      toast.error(res.errors?.[0]?.message ?? "Failed to delete worker");
      setShowDeleteModal(false);
    }
  }

  async function handleSave() {
    if (!config?.apiToken || !config?.accountId) return;
    setSaving(true);
    const body: Partial<CFWorkerSettings> = {
      usage_model: usageModel,
      placement: { mode: placement },
      logpush,
    };
    if (compatDate) body.compatibility_date = compatDate;

    const res = await cfApiCall(
      config.apiToken,
      `/accounts/${config.accountId}/workers/${decodedName}/settings`,
      { method: "PATCH", body: JSON.stringify(body) }
    );
    setSaving(false);
    if (res.success) {
      toast.success("Settings saved successfully");
      if (res.result) {
        const s = res.result as CFWorkerSettings;
        setSettings(s);
      }
    } else {
      toast.error(res.errors?.[0]?.message ?? "Failed to save settings");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Runtime settings */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Runtime Settings</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Configure the worker runtime environment.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={load}
          >
            Reload
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Compatibility Date
            </label>
            <input
              type="date"
              value={compatDate}
              onChange={(e) => setCompatDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--cf-orange)] focus:outline-none"
            />
            <p className="text-xs text-[var(--text-tertiary)]">
              Controls which Workers runtime behaviors are enabled.
            </p>
          </div>

          <Select
            label="Usage Model"
            value={usageModel}
            onChange={(e) => setUsageModel(e.target.value as WorkerUsageModel)}
            options={[
              { value: "standard", label: "Standard" },
              { value: "bundled", label: "Bundled" },
              { value: "unbound", label: "Unbound" },
            ]}
          />

          <Select
            label="Smart Placement"
            value={placement}
            onChange={(e) => setPlacement(e.target.value as WorkerPlacementMode)}
            options={[
              { value: "off", label: "Off — run in the nearest data center" },
              { value: "smart", label: "Smart — optimize for latency to origin" },
            ]}
          />

          {/* Logpush toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Logpush</label>
            <button
              type="button"
              role="switch"
              aria-checked={logpush}
              onClick={() => setLogpush((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                logpush ? "bg-[var(--cf-orange)]" : "bg-[var(--bg-overlay)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  logpush ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <p className="text-xs text-[var(--text-tertiary)]">
              Send worker logs to Cloudflare Logpush destinations.
            </p>
          </div>
        </div>
      </Card>

      {/* Bindings (read-only) */}
      {(settings?.bindings ?? []).length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Bindings</h2>
            <div className="flex items-center gap-1 rounded-md bg-[var(--badge-info-bg)] px-2 py-0.5 text-[10px] text-[var(--color-info)] border border-[var(--badge-info-border)]">
              <Info className="h-3 w-3" />
              Read-only
            </div>
          </div>
          <p className="mb-3 text-xs text-[var(--text-tertiary)]">
            Binding changes require uploading the full worker script via Wrangler or the API.
          </p>
          <div className="space-y-2">
            {(settings?.bindings ?? []).map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
              >
                <span className="font-mono text-xs font-medium text-[var(--text-primary)]">{b.name}</span>
                <span className="rounded-md bg-[var(--bg-overlay)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                  {b.type}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Compatible flags */}
      {(settings?.compatibility_flags ?? []).length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Compatibility Flags
          </h2>
          <div className="flex flex-wrap gap-2">
            {(settings?.compatibility_flags ?? []).map((flag) => (
              <span
                key={flag}
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-xs text-[var(--text-secondary)]"
              >
                {flag}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          icon={saving ? undefined : <Save className="h-3.5 w-3.5" />}
          onClick={handleSave}
          loading={saving}
        >
          Save Settings
        </Button>
        <Button variant="secondary" onClick={load} disabled={saving}>
          Discard Changes
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[var(--badge-info-border)] bg-[var(--badge-info-bg)] px-3 py-2.5">
        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[var(--color-info)]" />
        <p className="text-xs text-[var(--color-info)]">
          Script content can only be updated via Wrangler CLI or the Workers API — changes here only affect metadata settings.
        </p>
      </div>

      {/* Custom Domains */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--text-tertiary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Custom Domains</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={loadDomains}
            loading={domainsLoading}
          />
        </div>
        {domainsLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
            ))}
          </div>
        ) : domains.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)]">
            No custom domains are linked to this worker.
          </p>
        ) : (
          <div className="space-y-2">
            {domains.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
              >
                <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                  {d.hostname}
                </span>
                <div className="flex items-center gap-2">
                  {d.zone_name && (
                    <span className="rounded-md bg-[var(--bg-overlay)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                      {d.zone_name}
                    </span>
                  )}
                  <span className="rounded-md bg-[var(--badge-info-bg)] border border-[var(--badge-info-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-info)]">
                    {d.environment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="border-[var(--badge-error-border)]">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-error)]">Danger Zone</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Permanently delete this worker and all its settings.
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Worker
        </Button>
      </Card>

      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete "${decodedName}"?`}
        description={`This will permanently delete the worker "${decodedName}" and all its associated settings. This action cannot be undone.`}
        confirmLabel="Delete Worker"
        loading={deleting}
      />
    </div>
  );
}
