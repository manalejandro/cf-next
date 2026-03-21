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
