"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/Modal";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFZoneSetting } from "@/lib/types";

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-40`}
      style={{ background: checked ? "var(--cf-orange)" : "var(--bg-overlay)" }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function CachePage({ params }: { params: Promise<{ zoneId: string }> }) {
  const { config } = useConfig();
  const toast = useToast();
  const [zoneId, setZoneId] = useState("");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => { params.then((p) => setZoneId(p.zoneId)); }, [params]);

  const load = useCallback(async () => {
    if (!config?.apiToken || !zoneId) return;
    setLoading(true);
    const res = await cfApiCall(config.apiToken, `/zones/${zoneId}/settings`);
    if (res.success && res.result) {
      const map: Record<string, unknown> = {};
      (res.result as CFZoneSetting[]).forEach((s) => { map[s.id] = s.value; });
      setSettings(map);
    }
    setLoading(false);
  }, [config, zoneId]);

  useEffect(() => { if (zoneId) load(); }, [zoneId, load]);

  async function updateSetting(id: string, value: unknown) {
    if (!config?.apiToken || !zoneId) return;
    setSaving(id);
    const res = await cfApiCall(config.apiToken, `/zones/${zoneId}/settings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    });
    setSaving(null);
    if (res.success && res.result) {
      setSettings((prev) => ({ ...prev, [id]: (res.result as CFZoneSetting).value }));
      toast.success("Setting updated");
    } else {
      toast.error(res.errors?.[0]?.message ?? "Failed to update setting");
    }
  }

  async function purgeAll() {
    if (!config?.apiToken || !zoneId) return;
    setPurging(true);
    const res = await cfApiCall(config.apiToken, `/zones/${zoneId}/purge`, {
      method: "POST",
      body: JSON.stringify({ purge_everything: true }),
    });
    setPurging(false);
    setShowPurgeConfirm(false);
    if (res.success) toast.success("Cache purged successfully");
    else toast.error(res.errors?.[0]?.message ?? "Failed to purge cache");
  }

  const browserCacheTtl = (settings["browser_cache_ttl"] as number) ?? 14400;
  const cacheLevel = (settings["cache_level"] as string) ?? "aggressive";
  const devMode = (settings["development_mode"] as string) === "on";
  const queryStringSort = (settings["sort_query_string_for_cache"] as string) === "on";
  const alwaysOnline = (settings["always_online"] as string) === "on";

  const browserCacheTtlOptions = [
    { value: "0", label: "Respect existing headers" },
    { value: "1800", label: "30 minutes" },
    { value: "3600", label: "1 hour" },
    { value: "7200", label: "2 hours" },
    { value: "14400", label: "4 hours" },
    { value: "28800", label: "8 hours" },
    { value: "57600", label: "16 hours" },
    { value: "86400", label: "1 day" },
    { value: "172800", label: "2 days" },
    { value: "259200", label: "3 days" },
    { value: "604800", label: "1 week" },
    { value: "1209600", label: "2 weeks" },
    { value: "2419200", label: "1 month" },
  ];

  return (
    <div>
      <PageHeader
        title="Cache"
        description="Configure caching rules and browser cache settings"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>
              Refresh
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setShowPurgeConfirm(true)}
            >
              Purge All
            </Button>
          </div>
        }
      />

      {/* Development mode warning */}
      {!loading && devMode && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-warning)]/30 bg-[#3d2d0a]/30 px-4 py-3 text-sm text-[var(--color-warning)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <strong>Development Mode is active.</strong> &nbsp;Caching is bypassed for this zone. Disable when done testing.
        </div>
      )}

      <Card padding="none">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Cache Settings</h3>
        </div>
        <div className="px-5">
          {loading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-[var(--bg-elevated)]" />
              ))}
            </div>
          ) : (
            <>
              <SettingRow
                label="Cache Level"
                description="Determines how much of your website content is cached"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={cacheLevel}
                    onChange={(e) => updateSetting("cache_level", e.target.value)}
                    options={[
                      { value: "bypass", label: "Bypass" },
                      { value: "basic", label: "Basic" },
                      { value: "simplified", label: "Simplified" },
                      { value: "aggressive", label: "Standard" },
                      { value: "cache_everything", label: "Cache Everything" },
                    ]}
                    className="w-44"
                  />
                  {saving === "cache_level" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="Browser Cache TTL"
                description="Determines how long Cloudflare instructs a visitor's browser to cache files"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={String(browserCacheTtl)}
                    onChange={(e) => updateSetting("browser_cache_ttl", parseInt(e.target.value, 10))}
                    options={browserCacheTtlOptions}
                    className="w-44"
                  />
                  {saving === "browser_cache_ttl" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="Development Mode"
                description="Temporarily bypass Cloudflare's cache (expires after 3 hours)"
              >
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={devMode}
                    onChange={(v) => updateSetting("development_mode", v ? "on" : "off")}
                  />
                  {saving === "development_mode" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="Sort Query String"
                description="Improve cache hit ratio by sorting query string parameters"
              >
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={queryStringSort}
                    onChange={(v) => updateSetting("sort_query_string_for_cache", v ? "on" : "off")}
                  />
                  {saving === "sort_query_string_for_cache" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="Always Online"
                description="Serve cached content if the origin server is unavailable"
              >
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={alwaysOnline}
                    onChange={(v) => updateSetting("always_online", v ? "on" : "off")}
                  />
                  {saving === "always_online" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>
            </>
          )}
        </div>
      </Card>

      <ConfirmModal
        open={showPurgeConfirm}
        onClose={() => setShowPurgeConfirm(false)}
        onConfirm={purgeAll}
        loading={purging}
        title="Purge All Cache"
        description="This will immediately remove all cached content for this zone. Visitors will see freshly fetched content from your origin until the cache rebuilds. This action cannot be undone."
        confirmLabel="Purge Cache"
      />
    </div>
  );
}
