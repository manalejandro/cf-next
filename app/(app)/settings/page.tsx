"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  RefreshCw,
  Building2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { useConfig } from "@/components/ConfigProvider";
import { useToast } from "@/components/ui/Toast";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFAccount } from "@/lib/types";

type TokenStatus = "idle" | "verifying" | "valid" | "invalid";

export default function SettingsPage() {
  const { config, setConfig, clearConfig } = useConfig();
  const toast = useToast();
  const router = useRouter();

  const [token, setToken] = useState(config?.apiToken ?? "");
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("idle");
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CFAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(config?.accountId ?? "");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadAccounts = useCallback(
    async (tok: string) => {
      setLoadingAccounts(true);
      const res = await cfApiCall(tok, "/accounts");
      setLoadingAccounts(false);
      if (res.success && res.result) {
        const list = res.result as CFAccount[];
        setAccounts(list);
        if (list.length > 0 && !selectedAccountId) {
          setSelectedAccountId(list[0].id);
        }
      }
    },
    [selectedAccountId]
  );

  useEffect(() => {
    if (config?.apiToken) {
      setToken(config.apiToken);
      setTokenStatus("valid");
      loadAccounts(config.apiToken);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function verifyToken() {
    if (!token.trim()) return;
    setTokenStatus("verifying");
    const res = await cfApiCall(token.trim(), "/verify");
    if (res.success && res.result) {
      const result = res.result as { expires_on?: string; status?: string };
      setTokenStatus("valid");
      setTokenExpiry(result.expires_on ?? null);
      toast.success("Token verified successfully");
      await loadAccounts(token.trim());
    } else {
      setTokenStatus("invalid");
      toast.error("Token verification failed");
    }
  }

  function handleSave() {
    if (!token.trim()) {
      toast.error("Please enter an API token");
      return;
    }
    const account = accounts.find((a) => a.id === selectedAccountId);
    setConfig({
      apiToken: token.trim(),
      accountId: selectedAccountId,
      accountName: account?.name ?? "",
    });
    toast.success("Configuration saved");
    router.push("/");
  }

  function handleClear() {
    clearConfig();
    setToken("");
    setTokenStatus("idle");
    setTokenExpiry(null);
    setAccounts([]);
    setSelectedAccountId("");
    setShowClearConfirm(false);
    toast.success("Configuration cleared");
    router.push("/");
  }

  function renderTokenStatusBadge() {
    switch (tokenStatus) {
      case "verifying":
        return (
          <Badge variant="secondary">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
            Verifying…
          </Badge>
        );
      case "valid":
        return (
          <Badge variant="success">
            <CheckCircle className="h-3.5 w-3.5" />
            Valid
          </Badge>
        );
      case "invalid":
        return (
          <Badge variant="error">
            <XCircle className="h-3.5 w-3.5" />
            Invalid
          </Badge>
        );
      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your Cloudflare API credentials"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main config */}
        <div className="space-y-6 lg:col-span-2">
          {/* Token */}
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "var(--cf-orange-muted)" }}
              >
                <Key className="h-4 w-4" style={{ color: "var(--cf-orange)" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">API Token</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Required for all Cloudflare operations</p>
              </div>
              <div className="ml-auto">{renderTokenStatusBadge()}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Cloudflare API Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setTokenStatus("idle");
                    }}
                    placeholder="Enter your Cloudflare API token"
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--cf-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--cf-orange)]"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    onClick={() => setShowToken((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {tokenExpiry && (
                  <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                    Expires: {new Date(tokenExpiry).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={verifyToken}
                  loading={tokenStatus === "verifying"}
                  disabled={!token.trim()}
                >
                  Verify Token
                </Button>
              </div>
            </div>
          </Card>

          {/* Account */}
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "var(--cf-orange-muted)" }}
              >
                <Building2 className="h-4 w-4" style={{ color: "var(--cf-orange)" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Account</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Select your default Cloudflare account</p>
              </div>
            </div>

            {accounts.length === 0 && !loadingAccounts && (
              <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                Verify a valid token first to load accounts.
              </p>
            )}

            {(accounts.length > 0 || loadingAccounts) && (
              <div className="space-y-3">
                <Select
                  label="Active Account"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                  disabled={loadingAccounts}
                />
                {loadingAccounts && (
                  <p className="text-xs text-[var(--text-tertiary)]">Loading accounts…</p>
                )}
                {selectedAccountId && !loadingAccounts && (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    ID: <span className="font-mono text-[var(--text-secondary)]">{selectedAccountId}</span>
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setShowClearConfirm(true)}
              disabled={!config}
            >
              Clear Configuration
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSave}
              disabled={!token.trim()}
            >
              Save Settings
            </Button>
          </div>
        </div>

        {/* Help sidebar */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: "var(--cf-orange)" }} />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Security</h4>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
              Your API token is stored locally in your browser&apos;s localStorage. It is never sent to any external server — only to Cloudflare&apos;s API through this app&apos;s proxy routes.
            </p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: "var(--color-warning)" }} />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Token Permissions</h4>
            </div>
            <p className="mb-3 text-xs text-[var(--text-tertiary)] leading-relaxed">
              For full functionality, your token needs these permissions:
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {[
                "Zone · Read",
                "Zone · Edit",
                "DNS · Read",
                "DNS · Edit",
                "Firewall Services · Read",
                "Firewall Services · Edit",
                "Zone Settings · Read",
                "Zone Settings · Edit",
                "Cache Purge · Purge",
              ].map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[var(--cf-orange)]" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Create a Token</h4>
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
              Go to <strong className="text-[var(--text-secondary)]">Cloudflare Dashboard → My Profile → API Tokens → Create Token</strong> to generate a new token with the required permissions.
            </p>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear Configuration"
        description="This will remove your saved API token and account selection from this browser. You will need to re-enter your credentials to use the app again."
        confirmLabel="Clear"
      />
    </div>
  );
}
