import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

type Params = { params: Promise<{ accountId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { accountId } = await params;
  const token = req.headers.get("x-cf-token");
  if (!token) {
    return NextResponse.json(
      { success: false, errors: [{ code: 0, message: "Missing API token" }] },
      { status: 401 }
    );
  }
  const service = req.nextUrl.searchParams.get("service") ?? "";
  const url = new URL(`${CF_BASE}/accounts/${accountId}/workers/domains`);
  if (service) url.searchParams.set("service", service);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
