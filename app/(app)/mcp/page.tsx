"use client";

import { useState, useCallback } from "react";
import {
  Bot,
  ChevronRight,
  RefreshCw,
  PlayCircle,
  Terminal,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfig } from "@/components/ConfigProvider";
import type { MCPTool, MCPInputSchema, MCPProperty } from "@/lib/types";

// ─── MCP Server definitions ───────────────────────────────────────────────────

interface MCPServer {
  id: string;
  label: string;
  description: string;
  url: string;
  emoji: string;
  category: "core" | "workers" | "network" | "security" | "analytics";
}

const MCP_SERVERS: MCPServer[] = [
  {
    id: "cloudflare",
    label: "Cloudflare",
    description: "Full Cloudflare API via natural-language tools",
    url: "https://mcp.cloudflare.com/mcp",
    emoji: "☁️",
    category: "core",
  },
  {
    id: "docs",
    label: "Documentation",
    description: "Search and retrieve Cloudflare developer docs",
    url: "https://docs.mcp.cloudflare.com/mcp",
    emoji: "📚",
    category: "core",
  },
  {
    id: "workers-observability",
    label: "Workers Observability",
    description: "Query telemetry and invocation traces for Workers",
    url: "https://observability.mcp.cloudflare.com/mcp",
    emoji: "📊",
    category: "workers",
  },
  {
    id: "workers-bindings",
    label: "Workers Bindings",
    description: "Manage KV, D1, R2, Queues, and other bindings",
    url: "https://bindings.mcp.cloudflare.com/mcp",
    emoji: "🔗",
    category: "workers",
  },
  {
    id: "workers-builds",
    label: "Workers Builds",
    description: "View CI/CD build history and deployment status",
    url: "https://builds.mcp.cloudflare.com/mcp",
    emoji: "🏗️",
    category: "workers",
  },
  {
    id: "logs",
    label: "Logs",
    description: "Query and stream Cloudflare Logpush data",
    url: "https://logs.mcp.cloudflare.com/mcp",
    emoji: "📝",
    category: "workers",
  },
  {
    id: "radar",
    label: "Radar",
    description: "Global internet insights, trends, and attack data",
    url: "https://radar.mcp.cloudflare.com/mcp",
    emoji: "📡",
    category: "network",
  },
  {
    id: "dns-analytics",
    label: "DNS Analytics",
    description: "DNS query analytics and performance metrics",
    url: "https://dns-analytics.mcp.cloudflare.com/mcp",
    emoji: "🌐",
    category: "network",
  },
  {
    id: "graphql",
    label: "GraphQL Analytics",
    description: "Run raw GraphQL queries against Cloudflare analytics",
    url: "https://graphql.mcp.cloudflare.com/mcp",
    emoji: "⚡",
    category: "analytics",
  },
  {
    id: "ai-gateway",
    label: "AI Gateway",
    description: "Monitor and manage AI model gateway logs and limits",
    url: "https://ai-gateway.mcp.cloudflare.com/mcp",
    emoji: "🤖",
    category: "analytics",
  },
  {
    id: "autorag",
    label: "AutoRAG",
    description: "Create and query retrieval-augmented generation pipelines",
    url: "https://autorag.mcp.cloudflare.com/mcp",
    emoji: "🧠",
    category: "analytics",
  },
  {
    id: "browser",
    label: "Browser Rendering",
    description: "Scrape, screenshot, and interact with pages via headless browser",
    url: "https://browser.mcp.cloudflare.com/mcp",
    emoji: "🖥️",
    category: "core",
  },
  {
    id: "containers",
    label: "Containers",
    description: "Deploy and manage Cloudflare container instances",
    url: "https://containers.mcp.cloudflare.com/mcp",
    emoji: "📦",
    category: "workers",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    description: "Retrieve account-level audit and access logs",
    url: "https://auditlogs.mcp.cloudflare.com/mcp",
    emoji: "🔍",
    category: "security",
  },
  {
    id: "casb",
    label: "CASB",
    description: "Cloud Access Security Broker integrations and findings",
    url: "https://casb.mcp.cloudflare.com/mcp",
    emoji: "🔒",
    category: "security",
  },
  {
    id: "dex",
    label: "DEX",
    description: "Digital Experience Monitoring for WARP devices",
    url: "https://dex.mcp.cloudflare.com/mcp",
    emoji: "📱",
    category: "security",
  },
];

const CATEGORY_COLORS: Record<MCPServer["category"], string> = {
  core: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  workers: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  network: "bg-green-500/10 text-green-500 border-green-500/20",
  security: "bg-red-500/10 text-red-500 border-red-500/20",
  analytics: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

// ─── Form generator ───────────────────────────────────────────────────────────

function FieldInput({
  name,
  prop,
  required,
  value,
  onChange,
}: {
  name: string;
  prop: MCPProperty;
  required: boolean;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <label className="text-xs font-medium text-[var(--text-secondary)]">
      {name}
      {required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
      {prop.description && (
        <span className="ml-1.5 font-normal text-[var(--text-tertiary)]">{prop.description}</span>
      )}
    </label>
  );

  const baseInput =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--cf-orange)] focus:outline-none transition-colors";

  if (prop.enum) {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <select
          value={String(value ?? prop.default ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        >
          <option value="">— select —</option>
          {prop.enum.map((v) => (
            <option key={String(v)} value={String(v)}>
              {String(v)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (prop.type === "boolean") {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            value ? "bg-[var(--cf-orange)]" : "bg-[var(--bg-overlay)]"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              value ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {name}
          {prop.description && (
            <span className="ml-1.5 font-normal text-[var(--text-tertiary)]">{prop.description}</span>
          )}
        </span>
      </div>
    );
  }

  if (prop.type === "number" || prop.type === "integer") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <input
          type="number"
          value={value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className={baseInput}
        />
      </div>
    );
  }

  if (prop.type === "object" || prop.type === "array") {
    const strVal = value === undefined ? "" : JSON.stringify(value, null, 2);
    return (
      <div className="flex flex-col gap-1">
        {label}
        <textarea
          rows={4}
          value={strVal}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // keep raw string in state as-is
              onChange(e.target.value);
            }
          }}
          placeholder="JSON value"
          className={`${baseInput} font-mono text-xs resize-y`}
        />
      </div>
    );
  }

  // Default: string / text
  return (
    <div className="flex flex-col gap-1">
      {label}
      <input
        type="text"
        value={value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={baseInput}
      />
    </div>
  );
}

function ToolForm({
  tool,
  onExecute,
  executing,
}: {
  tool: MCPTool;
  onExecute: (args: Record<string, unknown>) => void;
  executing: boolean;
}) {
  const schema: MCPInputSchema = tool.inputSchema ?? { type: "object" };
  const properties = schema.properties ?? {};
  const required = schema.required ?? [];
  const keys = Object.keys(properties);

  const [args, setArgs] = useState<Record<string, unknown>>(() => {
    // Pre-fill defaults
    const defaults: Record<string, unknown> = {};
    for (const [k, p] of Object.entries(properties)) {
      if (p.default !== undefined) defaults[k] = p.default;
    }
    return defaults;
  });

  function setField(key: string, val: unknown) {
    setArgs((prev) => ({ ...prev, [key]: val }));
  }

  if (keys.length === 0) {
    return (
      <Button
        variant="primary"
        size="sm"
        icon={executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
        onClick={() => onExecute({})}
        loading={executing}
      >
        Execute
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {keys.map((k) => (
        <FieldInput
          key={k}
          name={k}
          prop={properties[k]}
          required={required.includes(k)}
          value={args[k]}
          onChange={(v) => setField(k, v)}
        />
      ))}
      <Button
        variant="primary"
        size="sm"
        icon={executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
        onClick={() => onExecute(args)}
        loading={executing}
      >
        Execute
      </Button>
    </div>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function ResultPanel({ result, error }: { result: unknown; error: string | null }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!result && !error) return null;

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--badge-error-border)] bg-[var(--badge-error-bg)] p-4 text-[var(--color-error)]">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="text-sm font-mono whitespace-pre-wrap break-all">{error}</p>
      </div>
    );
  }

  let displayText = JSON.stringify(result, null, 2);
  const rpc = result as Record<string, unknown>;
  if (rpc?.result) {
    const r = rpc.result as Record<string, unknown>;
    if (Array.isArray(r?.content)) {
      const texts = (r.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text" && c.text)
        .map((c) => {
          try {
            return JSON.stringify(JSON.parse(c.text!), null, 2);
          } catch {
            return c.text!;
          }
        });
      if (texts.length) displayText = texts.join("\n\n---\n\n");
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5" />
          Result
        </div>
        {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>
      {!collapsed && (
        <pre
          className="max-h-[32rem] overflow-y-auto px-4 py-3 text-xs font-mono text-[var(--text-primary)] break-words"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {displayText}
        </pre>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MCPPage() {
  const { config } = useConfig();

  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);

  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [execError, setExecError] = useState<string | null>(null);

  const loadTools = useCallback(async (server: MCPServer) => {
    if (!config?.apiToken) return;
    setToolsLoading(true);
    setToolsError(null);
    setTools([]);
    setSelectedTool(null);
    setResult(null);
    setExecError(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cf-token": config.apiToken,
        },
        body: JSON.stringify({ serverUrl: server.url, action: "list-tools" }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setToolsError((data.error as string) ?? `HTTP ${res.status}`);
      } else {
        const toolsList = (data?.result as Record<string, unknown>)?.tools as MCPTool[] | undefined;
        setTools(toolsList ?? []);
        if (!toolsList?.length) setToolsError("No tools returned by this server.");
      }
    } catch (e) {
      setToolsError(e instanceof Error ? e.message : "Network error");
    } finally {
      setToolsLoading(false);
    }
  }, [config]);

  const executeTool = useCallback(async (toolArgs: Record<string, unknown>) => {
    if (!config?.apiToken || !selectedServer || !selectedTool) return;
    setExecuting(true);
    setResult(null);
    setExecError(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cf-token": config.apiToken,
        },
        body: JSON.stringify({
          serverUrl: selectedServer.url,
          action: "call-tool",
          toolName: selectedTool.name,
          toolArgs,
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setExecError((data.error as string) ?? `HTTP ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (e) {
      setExecError(e instanceof Error ? e.message : "Network error");
    } finally {
      setExecuting(false);
    }
  }, [config, selectedServer, selectedTool]);

  function selectServer(server: MCPServer) {
    setSelectedServer(server);
    setTools([]);
    setSelectedTool(null);
    setResult(null);
    setExecError(null);
    setToolsError(null);
    loadTools(server);
  }

  function selectTool(tool: MCPTool) {
    setSelectedTool(tool);
    setResult(null);
    setExecError(null);
  }

  const grouped = MCP_SERVERS.reduce<Record<string, MCPServer[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});
  const categoryOrder: MCPServer["category"][] = ["core", "workers", "network", "security", "analytics"];
  const CATEGORY_LABELS: Record<MCPServer["category"], string> = {
    core: "Core",
    workers: "Workers",
    network: "Network",
    security: "Security",
    analytics: "Analytics",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="MCP" description="Connect to Cloudflare MCP servers and execute tools" />

      {!config?.apiToken && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--badge-error-border)] bg-[var(--badge-error-bg)] p-4 text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Configure your Cloudflare API token in Settings to use MCP servers.</p>
        </div>
      )}

      <div className="grid grid-cols-[17rem_1fr] gap-6 items-start">
        {/* ── Server list ── */}
        <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {categoryOrder.map((cat) => {
            const servers = grouped[cat];
            if (!servers?.length) return null;
            return (
              <div key={cat}>
                <div className="px-2 pt-2 pb-1">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${CATEGORY_COLORS[cat]}`}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>
                {servers.map((s) => {
                  const active = selectedServer?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectServer(s)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        active
                          ? "bg-[var(--cf-orange)]/10 text-[var(--cf-orange)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span className="text-base leading-none shrink-0">{s.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{s.label}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] truncate leading-snug">
                          {s.description}
                        </p>
                      </div>
                      {active && <ChevronRight className="ml-auto h-3 w-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-4">
          {!selectedServer ? (
            <Card className="py-16 text-center">
              <Bot className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">Select an MCP server</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)] max-w-xs mx-auto">
                Choose a Cloudflare MCP server on the left to browse its available tools.
              </p>
            </Card>
          ) : (
            <>
              {/* Server header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedServer.emoji}</span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                      {selectedServer.label}
                    </h2>
                    <p className="text-xs text-[var(--text-tertiary)]">{selectedServer.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => loadTools(selectedServer)}
                  loading={toolsLoading}
                >
                  Reload
                </Button>
              </div>

              {/* Tools error */}
              {toolsError && (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--badge-error-border)] bg-[var(--badge-error-bg)] p-4 text-[var(--color-error)]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{toolsError}</p>
                </div>
              )}

              {/* Loading */}
              {toolsLoading && (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
                  ))}
                </div>
              )}

              {/* Two-column when tools loaded */}
              {!toolsLoading && tools.length > 0 && (
                <div className="grid grid-cols-[14rem_1fr] gap-4 items-start">
                  {/* Tools list */}
                  <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 max-h-[60vh] overflow-y-auto">
                    <p className="px-2 pt-1 pb-1.5 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                      {tools.length} tool{tools.length !== 1 ? "s" : ""}
                    </p>
                    {tools.map((t) => {
                      const active = selectedTool?.name === t.name;
                      return (
                        <button
                          key={t.name}
                          onClick={() => selectTool(t)}
                          className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                            active
                              ? "bg-[var(--cf-orange)]/10 text-[var(--cf-orange)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Terminal className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium font-mono truncate">{t.name}</p>
                            {t.description && (
                              <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-2 leading-snug">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tool executor */}
                  <div className="space-y-4">
                    {!selectedTool ? (
                      <Card className="py-10 text-center">
                        <Terminal className="mx-auto mb-2 h-8 w-8 text-[var(--text-tertiary)]" />
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Select a tool to see its arguments and execute it.
                        </p>
                      </Card>
                    ) : (
                      <Card>
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold font-mono text-[var(--text-primary)]">
                            {selectedTool.name}
                          </h3>
                          {selectedTool.description && (
                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                              {selectedTool.description}
                            </p>
                          )}
                        </div>
                        <ToolForm
                          tool={selectedTool}
                          onExecute={executeTool}
                          executing={executing}
                        />
                      </Card>
                    )}

                    <ResultPanel result={result} error={execError} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
