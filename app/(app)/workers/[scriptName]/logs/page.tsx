"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import {
  Play,
  Square,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfig } from "@/components/ConfigProvider";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFWorkerTail, CFWorkerTailMessage } from "@/lib/types";

// ─── Outcome badge ────────────────────────────────────────────────────────────

type Outcome = CFWorkerTailMessage["outcome"];

const OUTCOME_STYLES: Record<Outcome, { label: string; icon: React.ElementType; classes: string }> = {
  ok:             { label: "OK",           icon: CheckCircle,    classes: "text-[var(--color-success)] bg-[var(--badge-success-bg)] border-[var(--badge-success-border)]" },
  exception:      { label: "Exception",    icon: XCircle,        classes: "text-[var(--color-error)]   bg-[var(--badge-error-bg)]   border-[var(--badge-error-border)]"   },
  exceededCpu:    { label: "CPU Limit",    icon: AlertTriangle,  classes: "text-[var(--color-warning)] bg-[var(--badge-warning-bg)] border-[var(--badge-warning-border)]" },
  exceededMemory: { label: "Mem Limit",    icon: AlertTriangle,  classes: "text-[var(--color-warning)] bg-[var(--badge-warning-bg)] border-[var(--badge-warning-border)]" },
  canceled:       { label: "Canceled",     icon: AlertCircle,    classes: "text-[var(--text-tertiary)] bg-[var(--bg-elevated)]      border-[var(--border-subtle)]"        },
  unknown:        { label: "Unknown",      icon: AlertCircle,    classes: "text-[var(--text-tertiary)] bg-[var(--bg-elevated)]      border-[var(--border-subtle)]"        },
};

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const { label, icon: Icon, classes } = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.unknown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${classes}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ─── Event row ────────────────────────────────────────────────────────────────

interface EventRowProps {
  msg: CFWorkerTailMessage;
  index: number;
}

function EventRow({ msg, index }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  const ts = msg.eventTimestamp ? new Date(msg.eventTimestamp) : null;
  const req = msg.event?.request;

  return (
    <div className="border-b border-[var(--border-subtle)] last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-elevated)] transition-colors"
      >
        {/* Index */}
        <span className="w-8 shrink-0 font-mono text-[10px] text-[var(--text-tertiary)] pt-0.5">
          #{index}
        </span>
        {/* Timestamp */}
        <span className="w-36 shrink-0 font-mono text-[10px] text-[var(--text-tertiary)] pt-0.5">
          {ts ? ts.toISOString().replace("T", " ").slice(0, 23) : "—"}
        </span>
        {/* Outcome */}
        <span className="shrink-0">
          <OutcomeBadge outcome={msg.outcome} />
        </span>
        {/* Request summary */}
        <span className="min-w-0 flex-1 font-mono text-xs text-[var(--text-secondary)] truncate">
          {req ? (
            <>
              <span className="text-[var(--cf-orange)] font-semibold mr-1.5">{req.method}</span>
              {req.url}
            </>
          ) : msg.event?.cron ? (
            <span className="text-[var(--color-info)]">⏱ {msg.event.cron}</span>
          ) : (
            "—"
          )}
        </span>
        {/* Status */}
        {msg.event?.response?.status && (
          <span className={`shrink-0 font-mono text-xs ${
            (msg.event.response.status as number) >= 500
              ? "text-[var(--color-error)]"
              : (msg.event.response.status as number) >= 400
              ? "text-[var(--color-warning)]"
              : "text-[var(--color-success)]"
          }`}>
            {msg.event.response.status}
          </span>
        )}
        <span className="shrink-0 text-[var(--text-tertiary)]">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 space-y-3">
          {/* Exceptions */}
          {msg.exceptions.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-error)]">
                Exceptions
              </p>
              {msg.exceptions.map((ex, i) => (
                <div key={i} className="rounded-lg bg-[var(--badge-error-bg)] border border-[var(--badge-error-border)] p-2.5 text-xs font-mono">
                  <p className="font-semibold text-[var(--color-error)]">{ex.name}</p>
                  <p className="mt-0.5 text-[var(--text-secondary)]">{ex.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Console logs */}
          {msg.logs.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                Console Logs
              </p>
              <div className="rounded-lg bg-[var(--bg-overlay)] border border-[var(--border-subtle)] p-2.5 space-y-1">
                {msg.logs.map((log, i) => (
                  <div key={i} className="flex gap-2 font-mono text-[10px]">
                    <span className={`shrink-0 ${
                      log.level === "error" ? "text-[var(--color-error)]" :
                      log.level === "warn"  ? "text-[var(--color-warning)]" :
                      "text-[var(--text-tertiary)]"
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-[var(--text-secondary)] break-all">
                      {log.message.map((m) =>
                        typeof m === "object" ? JSON.stringify(m) : String(m)
                      ).join(" ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request headers */}
          {req?.headers && Object.keys(req.headers).length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                Request Headers
              </p>
              <div className="rounded-lg bg-[var(--bg-overlay)] border border-[var(--border-subtle)] p-2.5 space-y-0.5">
                {Object.entries(req.headers).slice(0, 20).map(([k, v]) => (
                  <div key={k} className="flex gap-2 font-mono text-[10px]">
                    <span className="shrink-0 text-[var(--color-info)]">{k}:</span>
                    <span className="text-[var(--text-secondary)] break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Connection status badge ──────────────────────────────────────────────────

type ConnStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

function StatusBadge({ status }: { status: ConnStatus }) {
  const map: Record<ConnStatus, { label: string; icon: React.ElementType; classes: string }> = {
    idle:         { label: "Not connected",  icon: WifiOff,      classes: "text-[var(--text-tertiary)] bg-[var(--bg-elevated)]      border-[var(--border-subtle)]" },
    connecting:   { label: "Connecting…",    icon: Wifi,         classes: "text-[var(--color-info)]   bg-[var(--badge-info-bg)]    border-[var(--badge-info-border)]" },
    connected:    { label: "Live",           icon: Wifi,         classes: "text-[var(--color-success)] bg-[var(--badge-success-bg)] border-[var(--badge-success-border)]" },
    disconnected: { label: "Disconnected",   icon: WifiOff,      classes: "text-[var(--text-tertiary)] bg-[var(--bg-elevated)]      border-[var(--border-subtle)]" },
    error:        { label: "Error",          icon: AlertCircle,  classes: "text-[var(--color-error)]   bg-[var(--badge-error-bg)]   border-[var(--badge-error-border)]" },
  };
  const { label, icon: Icon, classes } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${classes}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_OUTCOMES: Outcome[] = ["ok", "exception", "exceededCpu", "exceededMemory", "canceled", "unknown"];

export default function WorkerLogsPage({
  params,
}: {
  params: Promise<{ scriptName: string }>;
}) {
  const { config } = useConfig();
  const { scriptName } = use(params);
  const decodedName = decodeURIComponent(scriptName);

  const [events, setEvents] = useState<CFWorkerTailMessage[]>([]);
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [connError, setConnError] = useState<string | null>(null);
  const [tail, setTail] = useState<CFWorkerTail | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<Set<Outcome>>(new Set(ALL_OUTCOMES));
  const [showFilter, setShowFilter] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const tailRef = useRef<CFWorkerTail | null>(null);
  // Ref mirrors status so closures inside WebSocket handlers always see the current value
  const statusRef = useRef<ConnStatus>("idle");
  // Guard against concurrent connect() calls (React may call the same handler twice)
  const connectingRef = useRef(false);

  function updateStatus(s: ConnStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  useEffect(() => {
    return () => {
      // Close socket without triggering the onclose → "disconnected" path
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        wsRef.current = null;
      }
      // Best-effort tail deletion
      const t = tailRef.current;
      const cfg = configRef.current;
      if (t && cfg?.apiToken && cfg?.accountId) {
        cfApiCall(
          cfg.apiToken,
          `/accounts/${cfg.accountId}/workers/${decodedName}/tails/${t.id}`,
          { method: "DELETE" }
        ).catch(() => {});
        tailRef.current = null;
      }
      connectingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Connect ─────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    if (!config?.apiToken || !config?.accountId) return;
    // Use ref so the guard works even when React batches state updates
    if (connectingRef.current) return;
    if (statusRef.current === "connecting" || statusRef.current === "connected") return;

    connectingRef.current = true;
    updateStatus("connecting");
    setConnError(null);

    // Create tail
    const res = await cfApiCall(
      config.apiToken,
      `/accounts/${config.accountId}/workers/${decodedName}/tails`,
      { method: "POST" }
    );

    if (!res.success || !res.result) {
      updateStatus("error");
      setConnError(res.errors?.[0]?.message ?? "Failed to create tail");
      connectingRef.current = false;
      return;
    }

    const newTail = res.result as CFWorkerTail;
    setTail(newTail);
    tailRef.current = newTail;

    // Open WebSocket
    try {
      const ws = new WebSocket(newTail.url, ["trace-v1"]);
      wsRef.current = ws;

      ws.onopen = () => {
        connectingRef.current = false;
        updateStatus("connected");
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as CFWorkerTailMessage;
          setEvents((prev) => [data, ...prev].slice(0, 500));
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        connectingRef.current = false;
        updateStatus("error");
        setConnError("WebSocket error — the tail may have expired.");
      };

      ws.onclose = () => {
        // Use statusRef to avoid stale closure over the `status` variable
        if (statusRef.current !== "idle") updateStatus("disconnected");
        connectingRef.current = false;
        tailRef.current = null;
        setTail(null);
      };
    } catch {
      connectingRef.current = false;
      updateStatus("error");
      setConnError("Failed to open WebSocket connection.");
    }
  }, [config, decodedName]);

  // ─── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    const ws = wsRef.current;
    if (ws) {
      ws.onclose = null; // prevent onclose from overriding "idle" status
      ws.onerror = null;
      ws.close();
      wsRef.current = null;
    }
    connectingRef.current = false;
    updateStatus("idle");

    const t = tailRef.current;
    if (t && config?.apiToken && config?.accountId) {
      tailRef.current = null;
      setTail(null);
      await cfApiCall(
        config.apiToken,
        `/accounts/${config.accountId}/workers/${decodedName}/tails/${t.id}`,
        { method: "DELETE" }
      );
    }
  }, [config, decodedName]);

  const filteredEvents = events.filter((e) => outcomeFilter.has(e.outcome));

  const toggleOutcome = (o: Outcome) => {
    setOutcomeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(o)) next.delete(o);
      else next.add(o);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {status === "connected" ? (
          <Button
            variant="danger"
            size="sm"
            icon={<Square className="h-3.5 w-3.5" />}
            onClick={disconnect}
          >
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={<Play className="h-3.5 w-3.5" />}
            onClick={connect}
            loading={status === "connecting"}
            disabled={status === "connecting"}
          >
            {status === "connecting" ? "Connecting…" : "Start Tail"}
          </Button>
        )}

        <StatusBadge status={status} />

        <div className="flex items-center gap-2 ml-auto">
          {/* Filter */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              icon={<Filter className="h-3.5 w-3.5" />}
              onClick={() => setShowFilter((v) => !v)}
            >
              Filter ({outcomeFilter.size}/{ALL_OUTCOMES.length})
            </Button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-1 z-10 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-2 shadow-lg">
                {ALL_OUTCOMES.map((o) => (
                  <label
                    key={o}
                    className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={outcomeFilter.has(o)}
                      onChange={() => toggleOutcome(o)}
                      className="accent-[var(--cf-orange)]"
                    />
                    <OutcomeBadge outcome={o} />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Clear */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setEvents([])}
            disabled={events.length === 0}
          >
            Clear
          </Button>
        </div>

        {/* Event count */}
        {events.length > 0 && (
          <span className="text-xs text-[var(--text-tertiary)]">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            {filteredEvents.length !== events.length && ` (${events.length} total)`}
          </span>
        )}
      </div>

      {/* Error */}
      {connError && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--badge-error-border)] bg-[var(--badge-error-bg)] p-4 text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{connError}</p>
        </div>
      )}

      {/* Hint */}
      {status === "idle" && events.length === 0 && (
        <Card className="py-14 text-center">
          <Wifi className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Real-time log tail</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Click <strong>Start Tail</strong> to begin streaming live logs from this worker.
          </p>
          <p className="mt-3 text-[10px] text-[var(--text-tertiary)]">
            Requires <code className="font-mono">Workers Tail</code> permission on your API token.
          </p>
        </Card>
      )}

      {/* Events */}
      {(status !== "idle" || events.length > 0) && (
        <Card padding="none">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Events</span>
            </div>
            {status === "connected" && (
              <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-success)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                Live
              </span>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">
                {status === "connected"
                  ? "Waiting for events… trigger your worker to see logs here."
                  : "No events captured."}
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredEvents.map((msg, i) => (
                <EventRow key={i} msg={msg} index={filteredEvents.length - i} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tail info */}
      {tail && (
        <p className="text-[10px] text-[var(--text-tertiary)]">
          Tail ID: <code className="font-mono">{tail.id}</code> — expires{" "}
          {new Date(tail.expires_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
