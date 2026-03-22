// ─── Cloudflare API Types ─────────────────────────────────────────────────────

export interface CFResponse<T> {
  result: T;
  success: boolean;
  errors: CFError[];
  messages: CFMessage[];
}

export interface CFListResponse<T> extends CFResponse<T[]> {
  result_info?: CFResultInfo;
}

export interface CFError {
  code: number;
  message: string;
}

export interface CFMessage {
  code: number;
  message: string;
}

export interface CFResultInfo {
  page: number;
  per_page: number;
  count: number;
  total_count: number;
  total_pages?: number;
}

// ─── Account ──────────────────────────────────────────────────────────────────

export interface CFAccount {
  id: string;
  name: string;
  type: "standard" | "enterprise";
  settings?: {
    enforce_twofactor?: boolean;
    use_account_custom_ns_by_default?: boolean;
  };
  created_on?: string;
}

// ─── Zone ─────────────────────────────────────────────────────────────────────

export type ZoneStatus = "active" | "pending" | "initializing" | "moved" | "deleted" | "deactivated";
export type ZoneType = "full" | "partial" | "secondary";

export interface CFZone {
  id: string;
  name: string;
  status: ZoneStatus;
  type: ZoneType;
  paused: boolean;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[] | null;
  original_registrar: string | null;
  original_dnshost: string | null;
  created_on: string;
  modified_on: string;
  activated_on: string | null;
  account: { id: string; name: string };
  owner: { id: string; name: string; type: string };
  plan: { id: string; name: string; price: number; currency: string; frequency: string };
  meta: {
    step: number;
    custom_certificate_quota: number;
    page_rule_quota: number;
    phishing_detected: boolean;
    multiple_railguns_allowed: boolean;
    wildcard_proxiable: boolean;
  };
}

export interface CreateZonePayload {
  name: string;
  account: { id: string };
  jump_start?: boolean;
  type?: ZoneType;
}

// ─── DNS Record ───────────────────────────────────────────────────────────────

export type DNSRecordType =
  | "A" | "AAAA" | "CAA" | "CERT" | "CNAME" | "DNSKEY"
  | "DS" | "HTTPS" | "LOC" | "MX" | "NAPTR" | "NS"
  | "PTR" | "SMIMEA" | "SPF" | "SRV" | "SSHFP"
  | "SVCB" | "TLSA" | "TXT" | "URI";

export interface CFDNSRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: DNSRecordType;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  comment: string | null;
  tags: string[];
  created_on: string;
  modified_on: string;
  priority?: number;
  meta?: {
    auto_added?: boolean;
    managed_by_apps?: boolean;
    managed_by_argo_tunnel?: boolean;
    source?: string;
  };
}

export interface CreateDNSRecordPayload {
  type: DNSRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  comment?: string;
  priority?: number;
}

export interface UpdateDNSRecordPayload extends Partial<CreateDNSRecordPayload> {}

// ─── Firewall ─────────────────────────────────────────────────────────────────

export type FirewallAction = "block" | "challenge" | "js_challenge" | "managed_challenge" | "allow" | "log" | "bypass";
export type FirewallMode = "simulate" | "ban" | "challenge" | "js_challenge" | "managed_challenge" | "whitelist";

export interface CFFirewallRule {
  id: string;
  description: string;
  action: FirewallAction;
  filter: {
    id: string;
    expression: string;
    paused: boolean;
    description: string;
    ref?: string;
  };
  paused: boolean;
  priority?: number;
  products?: string[];
  ref?: string;
  created_on?: string;
  modified_on?: string;
}

export interface CFAccessRule {
  id: string;
  notes: string;
  allowed_modes: FirewallMode[];
  mode: FirewallMode;
  configuration: {
    target: "ip" | "ip_range" | "asn" | "country";
    value: string;
  };
  scope: {
    id: string;
    name: string;
    type: "user" | "organization" | "zone";
    email?: string;
  };
  created_on?: string;
  modified_on?: string;
}

// ─── SSL / TLS ────────────────────────────────────────────────────────────────

export type SSLMode = "off" | "flexible" | "full" | "strict";
export type SSLStatus = "active" | "pending_validation" | "deleted" | "pending_issuance" | "pending_deployment" | "pending_deletion" | "pending_expiration" | "expired" | "active_uploading" | "deactivating" | "initializing_timed_out" | "validation_timed_out" | "issuance_timed_out" | "deployment_timed_out" | "deletion_timed_out" | "pending_cleanup" | "staging_deployment" | "staging_active" | "deactivating_staging" | "inactive" | "backup_issued" | "held_back";

export interface CFSSLSetting {
  id: "ssl";
  value: SSLMode;
  editable: boolean;
  modified_on: string;
}

export interface CFMinTLSVersion {
  id: "min_tls_version";
  value: "1.0" | "1.1" | "1.2" | "1.3";
  editable: boolean;
  modified_on: string;
}

export interface CFHTTPSRewrite {
  id: "automatic_https_rewrites";
  value: "on" | "off";
  editable: boolean;
  modified_on: string;
}

export interface CFHSTS {
  id: "security_header";
  value: {
    strict_transport_security: {
      enabled: boolean;
      max_age: number;
      include_subdomains: boolean;
      nosniff: boolean;
      preload: boolean;
    };
  };
  editable: boolean;
  modified_on: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export interface CFCacheSetting<T = unknown> {
  id: string;
  value: T;
  editable?: boolean;
  modified_on?: string;
}

// ─── Zone Settings (generic) ─────────────────────────────────────────────────

export interface CFZoneSetting {
  id: string;
  value: unknown;
  editable: boolean;
  modified_on: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface CFAnalyticsTotals {
  requests: {
    all: number;
    cached: number;
    uncached: number;
    content_type: Record<string, number>;
    country: Record<string, number>;
    ssl: { encrypted: number; unencrypted: number };
    http_status: Record<string, number>;
  };
  bandwidth: {
    all: number;
    cached: number;
    uncached: number;
    content_type: Record<string, number>;
    country: Record<string, number>;
    ssl: { encrypted: number; unencrypted: number };
  };
  threats: {
    all: number;
    country: Record<string, number>;
    type: Record<string, number>;
  };
  pageviews: {
    all: number;
    search_engine: Record<string, number>;
  };
  uniques: {
    all: number;
  };
}

// ─── Stored Config ────────────────────────────────────────────────────────────

export interface CFConfig {
  apiToken: string;
  accountId?: string;
  accountName?: string;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface CFAuditLog {
  id: string;
  when: string;
  action: {
    type: string;
    result: boolean;
  };
  actor: {
    id: string;
    email: string;
    type: "user" | "admin" | "cloudflare" | "Cloudflare";
    ip: string;
  };
  resource: {
    type: string;
    id: string;
  };
  zone: {
    id: string;
    name: string;
  } | null;
  newValue?: string;
  oldValue?: string;
  metadata?: Record<string, unknown>;
}

// ─── Zone Analytics ───────────────────────────────────────────────────────────

export interface CFAnalyticsDashboard {
  totals: CFAnalyticsTotals;
  timeseries: CFAnalyticsTotals[];
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export type WorkerUsageModel = "bundled" | "unbound" | "standard";
export type WorkerPlacementMode = "smart" | "off";

export interface CFWorkerScript {
  id: string;
  etag?: string;
  handlers?: string[];
  modified_on: string;
  created_on: string;
  usage_model?: WorkerUsageModel;
  compatibility_date?: string;
  compatibility_flags?: string[];
  placement?: { mode?: WorkerPlacementMode };
  last_deployed_from?: string;
  tail_consumers?: { service: string; environment?: string; namespace?: string }[];
  logpush?: boolean;
}

export type CFWorkerBinding =
  | { type: "plain_text"; name: string; text: string }
  | { type: "secret_text"; name: string }
  | { type: "kv_namespace"; name: string; namespace_id: string }
  | { type: "r2_bucket"; name: string; bucket_name: string }
  | { type: "service"; name: string; service: string; environment?: string }
  | { type: "d1"; name: string; id: string }
  | { type: "ai"; name: string }
  | { type: "queue"; name: string; queue_name: string }
  | { type: "analytics_engine"; name: string; dataset: string }
  | { type: string; name: string; [key: string]: unknown };

export interface CFWorkerSettings {
  bindings?: CFWorkerBinding[];
  compatibility_date?: string;
  compatibility_flags?: string[];
  usage_model?: WorkerUsageModel;
  tail_consumers?: { service: string; environment?: string; namespace?: string }[];
  placement?: { mode?: WorkerPlacementMode };
  logpush?: boolean;
}

export interface CFWorkerSchedule {
  cron: string;
  created_on?: string;
  modified_on?: string;
}

export interface CFWorkerTail {
  id: string;
  url: string;
  expires_at: string;
}

export interface CFWorkerTailMessage {
  outcome: "ok" | "exception" | "exceededCpu" | "exceededMemory" | "canceled" | "unknown";
  scriptName: string;
  exceptions: { name: string; message: string; timestamp: number }[];
  logs: { message: unknown[]; level: string; timestamp: number }[];
  eventTimestamp: number | null;
  event?: {
    request?: {
      url: string;
      method: string;
      headers: Record<string, string>;
      cf?: Record<string, unknown>;
    };
    response?: { status: number };
    scheduledTime?: string;
    cron?: string;
    [key: string]: unknown;
  };
}

// ─── Worker Custom Domains ────────────────────────────────────────────────────

export interface CFWorkerDomain {
  id: string;
  hostname: string;
  service: string;
  environment: string;
  zone_id: string;
  zone_name: string;
}

// ─── Workers Observability Telemetry ─────────────────────────────────────────

export interface CFObservabilityEventMeta {
  id: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  trigger?: string;
  parentSpanId?: string;
  service?: string;
  level?: string;
  duration?: number;
  statusCode?: number;
  traceDuration?: number;
  error?: string;
  message?: string;
  spanName?: string;
  url?: string;
  origin?: string;
}

export interface CFObservabilityEventWorkers {
  outcome: string;
  scriptName: string;
  eventType: string;
  cpuTimeMs?: number;
  wallTimeMs?: number;
  requestId: string;
  entrypoint?: string;
  executionModel?: string;
  event?: {
    request?: { url?: string; method?: string; path?: string };
    response?: { status?: number };
  };
}

export interface CFObservabilityEvent {
  dataset: string;
  timestamp: number;
  source: string | Record<string, unknown>;
  $metadata: CFObservabilityEventMeta;
  $workers?: CFObservabilityEventWorkers;
}

export interface CFObservabilityResult {
  events?: {
    events?: CFObservabilityEvent[];
    count?: number;
    fields?: { key: string; type: string }[];
  };
  invocations?: Record<string, CFObservabilityEvent[]>;
  statistics?: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

// ─── MCP Types ────────────────────────────────────────────────────────────────

export interface MCPProperty {
  type?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: MCPProperty;
  properties?: Record<string, MCPProperty>;
  required?: string[];
}

export interface MCPInputSchema {
  type: string;
  properties?: Record<string, MCPProperty>;
  required?: string[];
  description?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: MCPInputSchema;
}
