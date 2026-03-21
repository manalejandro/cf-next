import { NextRequest, NextResponse } from "next/server";

const CF_BASE = "https://api.cloudflare.com/client/v4";

type Params = { params: Promise<{ accountId: string; scriptName: string; tailId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { accountId, scriptName, tailId } = await params;
  const token = req.headers.get("x-cf-token");
  if (!token) {
    return NextResponse.json({ success: false, errors: [{ code: 0, message: "Missing API token" }] }, { status: 401 });
  }
  const res = await fetch(
    `${CF_BASE}/accounts/${accountId}/workers/scripts/${scriptName}/tails/${tailId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return NextResponse.json(await res.json(), { status: res.status });
}
