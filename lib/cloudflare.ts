import type {
  CFResponse,
  CFListResponse,
  CFAccount,
  CFZone,
  CreateZonePayload,
  CFDNSRecord,
  CreateDNSRecordPayload,
  UpdateDNSRecordPayload,
  CFFirewallRule,
  CFAccessRule,
  CFZoneSetting,
} from "./types";

const CF_BASE = "https://api.cloudflare.com/client/v4";

export class CloudflareAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: { code: number; message: string }[] = []
  ) {
    super(message);
    this.name = "CloudflareAPIError";
  }
}

async function cfFetch<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CF_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!data.success) {
    const messages = (data.errors ?? [])
      .map((e: { message: string }) => e.message)
      .join("; ");
    throw new CloudflareAPIError(
      messages || `Cloudflare API error (${res.status})`,
      res.status,
      data.errors ?? []
    );
  }

  return data;
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function listAccounts(token: string): Promise<CFListResponse<CFAccount>> {
  return cfFetch<CFListResponse<CFAccount>>(token, "/accounts?per_page=50");
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export async function listZones(
  token: string,
  params: { page?: number; per_page?: number; name?: string; status?: string; account_id?: string } = {}
): Promise<CFListResponse<CFZone>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.name) qs.set("name", params.name);
  if (params.status) qs.set("status", params.status);
  if (params.account_id) qs.set("account.id", params.account_id);

  const query = qs.toString() ? `?${qs.toString()}` : "";
  return cfFetch<CFListResponse<CFZone>>(token, `/zones${query}`);
}

export async function getZone(token: string, zoneId: string): Promise<CFResponse<CFZone>> {
  return cfFetch<CFResponse<CFZone>>(token, `/zones/${zoneId}`);
}

export async function createZone(
  token: string,
  payload: CreateZonePayload
): Promise<CFResponse<CFZone>> {
  return cfFetch<CFResponse<CFZone>>(token, "/zones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteZone(token: string, zoneId: string): Promise<CFResponse<{ id: string }>> {
  return cfFetch<CFResponse<{ id: string }>>(token, `/zones/${zoneId}`, {
    method: "DELETE",
  });
}

export async function purgeZoneCache(
  token: string,
  zoneId: string,
  payload: { purge_everything?: boolean; files?: string[] }
): Promise<CFResponse<{ id: string }>> {
  return cfFetch<CFResponse<{ id: string }>>(
    token,
    `/zones/${zoneId}/purge_cache`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

// ─── DNS Records ──────────────────────────────────────────────────────────────

export async function listDNSRecords(
  token: string,
  zoneId: string,
  params: { page?: number; per_page?: number; type?: string; name?: string } = {}
): Promise<CFListResponse<CFDNSRecord>> {
  const qs = new URLSearchParams({ per_page: String(params.per_page ?? 100) });
  if (params.page) qs.set("page", String(params.page));
  if (params.type) qs.set("type", params.type);
  if (params.name) qs.set("name", params.name);

  return cfFetch<CFListResponse<CFDNSRecord>>(
    token,
    `/zones/${zoneId}/dns_records?${qs.toString()}`
  );
}

export async function createDNSRecord(
  token: string,
  zoneId: string,
  payload: CreateDNSRecordPayload
): Promise<CFResponse<CFDNSRecord>> {
  return cfFetch<CFResponse<CFDNSRecord>>(token, `/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDNSRecord(
  token: string,
  zoneId: string,
  recordId: string,
  payload: UpdateDNSRecordPayload
): Promise<CFResponse<CFDNSRecord>> {
  return cfFetch<CFResponse<CFDNSRecord>>(
    token,
    `/zones/${zoneId}/dns_records/${recordId}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
}

export async function deleteDNSRecord(
  token: string,
  zoneId: string,
  recordId: string
): Promise<CFResponse<{ id: string }>> {
  return cfFetch<CFResponse<{ id: string }>>(
    token,
    `/zones/${zoneId}/dns_records/${recordId}`,
    { method: "DELETE" }
  );
}

// ─── Firewall ─────────────────────────────────────────────────────────────────

export async function listFirewallRules(
  token: string,
  zoneId: string,
  params: { page?: number; per_page?: number } = {}
): Promise<CFListResponse<CFFirewallRule>> {
  const qs = new URLSearchParams({ per_page: String(params.per_page ?? 50) });
  if (params.page) qs.set("page", String(params.page));
  return cfFetch<CFListResponse<CFFirewallRule>>(
    token,
    `/zones/${zoneId}/firewall/rules?${qs.toString()}`
  );
}

export async function listAccessRules(
  token: string,
  zoneId: string,
  params: { page?: number; per_page?: number } = {}
): Promise<CFListResponse<CFAccessRule>> {
  const qs = new URLSearchParams({ per_page: String(params.per_page ?? 50) });
  if (params.page) qs.set("page", String(params.page));
  return cfFetch<CFListResponse<CFAccessRule>>(
    token,
    `/zones/${zoneId}/firewall/access_rules/rules?${qs.toString()}`
  );
}

// ─── Zone Settings ────────────────────────────────────────────────────────────

export async function getZoneSettings(
  token: string,
  zoneId: string
): Promise<CFListResponse<CFZoneSetting>> {
  return cfFetch<CFListResponse<CFZoneSetting>>(token, `/zones/${zoneId}/settings`);
}

export async function updateZoneSetting(
  token: string,
  zoneId: string,
  settingId: string,
  value: unknown
): Promise<CFResponse<CFZoneSetting>> {
  return cfFetch<CFResponse<CFZoneSetting>>(
    token,
    `/zones/${zoneId}/settings/${settingId}`,
    { method: "PATCH", body: JSON.stringify({ value }) }
  );
}

// ─── Verify token ─────────────────────────────────────────────────────────────

export async function verifyToken(
  token: string
): Promise<{ valid: boolean; status: string; expiresOn?: string }> {
  const res = await fetch(`${CF_BASE}/user/tokens/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) return { valid: false, status: "Invalid token" };
  return {
    valid: true,
    status: data.result?.status ?? "active",
    expiresOn: data.result?.expires_on,
  };
}
