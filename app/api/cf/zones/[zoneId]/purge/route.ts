import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

type Params = { params: Promise<{ zoneId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { zoneId } = await params;
  const token = req.headers.get("x-cf-token");
  if (!token) return NextResponse.json({ success: false, errors: [{ code: 0, message: "Missing API token" }] }, { status: 401 });
  const body = await req.text();
  const res = await fetch(`${CF_BASE}/zones/${zoneId}/purge_cache`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
