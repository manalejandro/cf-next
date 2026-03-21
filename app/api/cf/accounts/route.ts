import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

async function proxyToCF(req: NextRequest, cfPath: string, method?: string) {
  const token = req.headers.get("x-cf-token");
  if (!token) {
    return NextResponse.json({ success: false, errors: [{ code: 0, message: "Missing API token" }] }, { status: 401 });
  }

  const body = method && method !== "GET" && method !== "DELETE" ? await req.text() : undefined;

  const res = await fetch(`${CF_BASE}${cfPath}`, {
    method: method ?? req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  return proxyToCF(req, "/accounts?per_page=50", "GET");
}
