import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const token = req.headers.get("x-cf-token");
  if (!token) return NextResponse.json({ success: false, errors: [{ message: "Missing API token" }] }, { status: 401 });

  const { accountId } = await params;
  const searchParams = req.nextUrl.searchParams.toString();
  const qs = searchParams ? `?${searchParams}` : "";

  const cfRes = await fetch(`${CF_BASE}/accounts/${accountId}/audit_logs${qs}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await cfRes.json();
  return NextResponse.json(data, { status: cfRes.status });
}
