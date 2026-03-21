import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

type Params = { params: Promise<{ zoneId: string; ruleId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { zoneId, ruleId } = await params;
  const token = req.headers.get("x-cf-token");
  if (!token)
    return NextResponse.json(
      { success: false, errors: [{ code: 0, message: "Missing API token" }] },
      { status: 401 }
    );
  const res = await fetch(
    `${CF_BASE}/zones/${zoneId}/firewall/access_rules/rules/${ruleId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    }
  );
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { zoneId, ruleId } = await params;
  const token = req.headers.get("x-cf-token");
  if (!token)
    return NextResponse.json(
      { success: false, errors: [{ code: 0, message: "Missing API token" }] },
      { status: 401 }
    );
  const body = await req.text();
  const res = await fetch(
    `${CF_BASE}/zones/${zoneId}/firewall/access_rules/rules/${ruleId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
    }
  );
  return NextResponse.json(await res.json(), { status: res.status });
}
