import { NextRequest, NextResponse } from "next/server";

const CF_GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";

// ─── GraphQL query bodies ─────────────────────────────────────────────────────
// Without `dimensions`, the dataset aggregates everything into a single row.

const HOURLY_QUERY = `
query ZoneAnalytics($zoneTag: String!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1hGroups(
        limit: 1
        filter: { datetime_geq: $since, datetime_lt: $until }
      ) {
        sum {
          requests
          cachedRequests
          bytes
          cachedBytes
          pageViews
          threats
          contentTypeMap { requests edgeResponseContentTypeName }
          countryMap { requests threats clientCountryName }
          responseStatusMap { requests edgeResponseStatus }
        }
        uniq { uniques }
      }
    }
  }
}`.trim();

const DAILY_QUERY = `
query ZoneAnalyticsDaily($zoneTag: String!, $since: Date!, $until: Date!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(
        limit: 1
        filter: { date_geq: $since, date_lt: $until }
      ) {
        sum {
          requests
          cachedRequests
          bytes
          cachedBytes
          pageViews
          threats
          contentTypeMap { requests edgeResponseContentTypeName }
          countryMap { requests threats clientCountryName }
          responseStatusMap { requests edgeResponseStatus }
        }
        uniq { uniques }
      }
    }
  }
}`.trim();

// ─── Type helpers ─────────────────────────────────────────────────────────────

interface GQLGroup {
  sum: {
    requests: number;
    cachedRequests: number;
    bytes: number;
    cachedBytes: number;
    pageViews: number;
    threats: number;
    contentTypeMap: { requests: number; edgeResponseContentTypeName: string }[];
    countryMap: { requests: number; threats: number; clientCountryName: string }[];
    responseStatusMap: { requests: number; edgeResponseStatus: number }[];
  };
  uniq: { uniques: number };
}

function buildTotals(groups: GQLGroup[]) {
  const totals = {
    requests: { all: 0, cached: 0, uncached: 0, content_type: {} as Record<string, number>, country: {} as Record<string, number>, ssl: { encrypted: 0, unencrypted: 0 }, http_status: {} as Record<string, number> },
    bandwidth: { all: 0, cached: 0, uncached: 0, content_type: {} as Record<string, number>, country: {} as Record<string, number>, ssl: { encrypted: 0, unencrypted: 0 } },
    threats: { all: 0, country: {} as Record<string, number>, type: {} as Record<string, number> },
    pageviews: { all: 0, search_engine: {} as Record<string, number> },
    uniques: { all: 0 },
  };

  for (const g of groups) {
    totals.requests.all += g.sum.requests;
    totals.requests.cached += g.sum.cachedRequests;
    totals.bandwidth.all += g.sum.bytes;
    totals.bandwidth.cached += g.sum.cachedBytes;
    totals.threats.all += g.sum.threats;
    totals.pageviews.all += g.sum.pageViews;
    totals.uniques.all += g.uniq.uniques;

    for (const ct of g.sum.contentTypeMap ?? []) {
      const k = ct.edgeResponseContentTypeName;
      totals.requests.content_type[k] = (totals.requests.content_type[k] ?? 0) + ct.requests;
    }
    for (const cm of g.sum.countryMap ?? []) {
      const k = cm.clientCountryName;
      totals.requests.country[k] = (totals.requests.country[k] ?? 0) + cm.requests;
      totals.threats.country[k] = (totals.threats.country[k] ?? 0) + cm.threats;
    }
    for (const rs of g.sum.responseStatusMap ?? []) {
      const k = String(rs.edgeResponseStatus);
      totals.requests.http_status[k] = (totals.requests.http_status[k] ?? 0) + rs.requests;
    }
  }

  totals.requests.uncached = totals.requests.all - totals.requests.cached;
  totals.bandwidth.uncached = totals.bandwidth.all - totals.bandwidth.cached;

  return totals;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  const token = req.headers.get("x-cf-token");
  if (!token) {
    return NextResponse.json({ success: false, errors: [{ message: "Missing API token" }] }, { status: 401 });
  }

  const { zoneId } = await params;
  const since = req.nextUrl.searchParams.get("since") ?? new Date(Date.now() - 86_400_000).toISOString();
  const until = req.nextUrl.searchParams.get("until") ?? new Date().toISOString();

  // Decide hourly vs daily based on the time range (>7d → daily)
  const diffMs = new Date(until).getTime() - new Date(since).getTime();
  const useDaily = diffMs > 7 * 24 * 60 * 60 * 1000;

  const query = useDaily ? DAILY_QUERY : HOURLY_QUERY;
  const variables = useDaily
    ? { zoneTag: zoneId, since: since.slice(0, 10), until: until.slice(0, 10) }
    : { zoneTag: zoneId, since, until };

  const gqlRes = await fetch(CF_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!gqlRes.ok) {
    return NextResponse.json({ success: false, errors: [{ message: `GraphQL request failed: ${gqlRes.status}` }] }, { status: gqlRes.status });
  }

  const gqlData = await gqlRes.json() as {
    data?: { viewer?: { zones?: { httpRequests1hGroups?: GQLGroup[]; httpRequests1dGroups?: GQLGroup[] }[] } };
    errors?: { message: string }[];
  };

  if (gqlData.errors?.length) {
    return NextResponse.json({ success: false, errors: gqlData.errors.map((e) => ({ message: e.message })) });
  }

  const zone = gqlData.data?.viewer?.zones?.[0];
  if (!zone) {
    return NextResponse.json({ success: false, errors: [{ message: "No zone data returned" }] });
  }

  const groups: GQLGroup[] = (useDaily ? zone.httpRequests1dGroups : zone.httpRequests1hGroups) ?? [];
  const totals = buildTotals(groups);

  return NextResponse.json({ success: true, result: { totals } });
}

