import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-cf-token");
  if (!token) {
    return NextResponse.json({ success: false, errors: [{ code: 0, message: "Missing API token" }] }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const res = await fetch(`${CF_BASE}/zones${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-cf-token");
  if (!token) {
    return NextResponse.json({ success: false, errors: [{ code: 0, message: "Missing API token" }] }, { status: 401 });
  }
  const body = await req.text();
  const res = await fetch(`${CF_BASE}/zones`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
