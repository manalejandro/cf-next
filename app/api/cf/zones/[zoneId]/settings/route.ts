import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

type Params = { params: Promise<{ zoneId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { zoneId } = await params;
  const token = req.headers.get("x-cf-token");
  if (!token) return NextResponse.json({ success: false, errors: [{ code: 0, message: "Missing API token" }] }, { status: 401 });
  const res = await fetch(`${CF_BASE}/zones/${zoneId}/settings`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
