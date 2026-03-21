"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, RefreshCw, AlertCircle, CheckCircle, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFZoneSetting } from "@/lib/types";

const SSL_MODES = [
  { value: "off", label: "Off — No HTTPS", description: "HTTP only. Visitors see a warning." },
  { value: "flexible", label: "Flexible", description: "HTTPS from visitor to Cloudflare, HTTP to origin." },
  { value: "full", label: "Full", description: "HTTPS to Cloudflare and origin (no cert validation)." },
  { value: "strict", label: "Full (Strict)", description: "HTTPS with valid certificate required on origin." },
];

const TLS_VERSIONS = [
  { value: "1.0", label: "TLS 1.0" },
  { value: "1.1", label: "TLS 1.1" },
  { value: "1.2", label: "TLS 1.2 (Recommended)" },
  { value: "1.3", label: "TLS 1.3" },
];

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{description}</p>
      </div>
      <div className="shrink-0 w-48">{children}</div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
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

export default function SSLPage({ params }: { params: Promise<{ zoneId: string }> }) {
  const { config } = useConfig();
  const toast = useToast();
  const [zoneId, setZoneId] = useState("");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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

  const sslMode = (settings["ssl"] as string) ?? "off";
  const minTls = (settings["min_tls_version"] as string) ?? "1.2";
  const httpsRewrite = (settings["automatic_https_rewrites"] as string) === "on";
  const hsts = (settings["security_header"] as { strict_transport_security?: { enabled?: boolean } })?.strict_transport_security?.enabled ?? false;
  const tls13 = (settings["tls_1_3"] as string) === "on";
  const alwaysHttps = (settings["always_use_https"] as string) === "on";

  const sslModeInfo = SSL_MODES.find((m) => m.value === sslMode);

  return (
    <div>
      <PageHeader
        title="SSL / TLS"
        description="Configure SSL/TLS encryption and security settings"
        actions={
          <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>
            Refresh
          </Button>
        }
      />

      {/* SSL Mode hero */}
      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${sslMode === "off" ? "bg-[#3d1a1a]" : "bg-[var(--cf-orange)]/10"}`}>
            <Lock className={`h-6 w-6 ${sslMode === "off" ? "text-[var(--color-error)]" : "text-[var(--cf-orange)]"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">SSL/TLS Encryption Mode</h3>
              <Badge variant={sslMode === "off" ? "error" : sslMode === "strict" ? "success" : "warning"}>
                {sslModeInfo?.label ?? sslMode}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{sslModeInfo?.description}</p>
          </div>
          <div className="shrink-0 w-44">
            {loading ? (
              <div className="h-9 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
            ) : (
              <Select
                value={sslMode}
                onChange={(e) => updateSetting("ssl", e.target.value)}
                options={SSL_MODES.map((m) => ({ value: m.value, label: m.label.split("—")[0].trim() }))}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Security settings */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Security Settings</h3>
        </div>
        <div className="px-5">
          {loading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-[var(--bg-elevated)]" />
              ))}
            </div>
          ) : (
            <>
              <SettingRow
                label="Minimum TLS Version"
                description="Reject connections using older TLS versions"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={minTls}
                    onChange={(e) => updateSetting("min_tls_version", e.target.value)}
                    options={TLS_VERSIONS}
                  />
                  {saving === "min_tls_version" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="TLS 1.3"
                description="Enable the latest TLS protocol version for improved security"
              >
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={tls13}
                    onChange={(v) => updateSetting("tls_1_3", v ? "on" : "off")}
                  />
                  {saving === "tls_1_3" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="Always Use HTTPS"
                description="Redirect all HTTP requests to HTTPS"
              >
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={alwaysHttps}
                    onChange={(v) => updateSetting("always_use_https", v ? "on" : "off")}
                  />
                  {saving === "always_use_https" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="Automatic HTTPS Rewrites"
                description="Rewrite HTTP links in your pages to HTTPS"
              >
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={httpsRewrite}
                    onChange={(v) => updateSetting("automatic_https_rewrites", v ? "on" : "off")}
                  />
                  {saving === "automatic_https_rewrites" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--cf-orange)] border-t-transparent" />}
                </div>
              </SettingRow>

              <SettingRow
                label="HTTP Strict Transport Security (HSTS)"
                description="Tell browsers to only use HTTPS for this domain"
              >
                <Badge variant={hsts ? "success" : "secondary"} dot>
                  {hsts ? "Enabled" : "Disabled"}
                </Badge>
              </SettingRow>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
