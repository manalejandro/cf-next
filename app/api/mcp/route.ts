import { NextRequest, NextResponse } from "next/server";

// Allowlist of Cloudflare MCP server hostnames — prevents SSRF
const ALLOWED_MCP_HOSTS = new Set([
  "mcp.cloudflare.com",
  "docs.mcp.cloudflare.com",
  "bindings.mcp.cloudflare.com",
  "builds.mcp.cloudflare.com",
  "observability.mcp.cloudflare.com",
  "radar.mcp.cloudflare.com",
  "containers.mcp.cloudflare.com",
  "browser.mcp.cloudflare.com",
  "logs.mcp.cloudflare.com",
  "ai-gateway.mcp.cloudflare.com",
  "autorag.mcp.cloudflare.com",
  "auditlogs.mcp.cloudflare.com",
  "dns-analytics.mcp.cloudflare.com",
  "dex.mcp.cloudflare.com",
  "casb.mcp.cloudflare.com",
  "graphql.mcp.cloudflare.com",
]);

function validateMcpUrl(serverUrl: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(serverUrl);
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are allowed" };
  }
  if (!ALLOWED_MCP_HOSTS.has(parsed.hostname)) {
    return {
      valid: false,
      error: `Host '${parsed.hostname}' is not an allowed Cloudflare MCP server`,
    };
  }
  return { valid: true };
}

type McpBody =
  | { serverUrl: string; action: "list-tools" }
  | { serverUrl: string; action: "call-tool"; toolName: string; toolArgs?: Record<string, unknown> };

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-cf-token");
  if (!token) {
    return NextResponse.json({ error: "Missing API token" }, { status: 401 });
  }

  const body = (await req.json()) as McpBody;
  const { serverUrl, action } = body;

  const validation = validateMcpUrl(serverUrl);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Build the actual JSON-RPC request
  const initMsg = {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "cf-next", version: "1.0.0" },
    },
  };

  let requestMsg: Record<string, unknown>;
  if (action === "list-tools") {
    requestMsg = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };
  } else if (action === "call-tool") {
    const { toolName, toolArgs } = body as {
      serverUrl: string;
      action: "call-tool";
      toolName: string;
      toolArgs?: Record<string, unknown>;
    };
    if (!toolName) {
      return NextResponse.json({ error: "toolName is required for call-tool" }, { status: 400 });
    }
    requestMsg = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: toolArgs ?? {} },
    };
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Step 1: Send initialize to establish MCP session
  const initRes = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json,text/event-stream",
    },
    body: JSON.stringify(initMsg),
  });

  const sessionId = initRes.headers.get("mcp-session-id");

  // Step 2: Send the actual request
  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Accept: "application/json,text/event-stream",
  };
  if (sessionId) reqHeaders["mcp-session-id"] = sessionId;

  const mcpRes = await fetch(serverUrl, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify(requestMsg),
  });

  if (!mcpRes.ok) {
    const text = await mcpRes.text();
    return NextResponse.json(
      { error: `MCP server returned HTTP ${mcpRes.status}: ${text.slice(0, 500)}` },
      { status: mcpRes.status }
    );
  }

  const contentType = mcpRes.headers.get("content-type") ?? "";

  // Handle SSE response (parse last data: event)
  if (contentType.includes("text/event-stream")) {
    const text = await mcpRes.text();
    const lines = text.split("\n").filter((l) => l.startsWith("data:"));
    const lastData = lines[lines.length - 1]?.slice(5).trim();
    if (!lastData) {
      return NextResponse.json({ error: "Empty SSE response from MCP server" }, { status: 502 });
    }
    try {
      const parsed = JSON.parse(lastData) as unknown;
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse SSE response", raw: lastData.slice(0, 500) },
        { status: 502 }
      );
    }
  }

  // Direct JSON response
  const result = await mcpRes.json();
  return NextResponse.json(result);
}
