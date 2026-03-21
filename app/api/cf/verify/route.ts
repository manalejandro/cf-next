import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-cf-token");
  if (!token) return NextResponse.json({ success: false, errors: [{ code: 0, message: "Missing API token" }] }, { status: 401 });
  const res = await fetch(`${CF_BASE}/user/tokens/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
