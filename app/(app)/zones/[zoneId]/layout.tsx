"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Shield, Lock, Zap, ArrowLeft } from "lucide-react";
import { useConfig } from "@/components/ConfigProvider";
import { cfApiCall } from "@/hooks/useCFApi";
import type { CFZone } from "@/lib/types";

const ZONE_NAV = [
  { href: "", label: "Overview", icon: Globe },
  { href: "/dns", label: "DNS", icon: Globe },
  { href: "/firewall", label: "Firewall", icon: Shield },
  { href: "/ssl", label: "SSL / TLS", icon: Lock },
  { href: "/cache", label: "Cache", icon: Zap },
];

export default function ZoneLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ zoneId: string }>;
}) {
  const { config } = useConfig();
  const pathname = usePathname();
  const [zone, setZone] = useState<CFZone | null>(null);
  const [zoneId, setZoneId] = useState<string>("");

  useEffect(() => {
    params.then(async (p) => {
      setZoneId(p.zoneId);
      if (!config?.apiToken) return;
      const res = await cfApiCall(config.apiToken, `/zones/${p.zoneId}`);
      if (res.success && res.result) setZone(res.result as CFZone);
    });
  }, [params, config]);

  const baseHref = `/zones/${zoneId}`;

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="mb-6">
        <Link
          href="/zones"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Zones
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cf-orange)]/10">
            <Globe className="h-5 w-5 text-[var(--cf-orange)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {zone?.name ?? "Loading…"}
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">{zoneId}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {ZONE_NAV.map(({ href, label, icon: Icon }) => {
          const fullHref = `${baseHref}${href}`;
          const active = href === ""
            ? pathname === baseHref
            : pathname.startsWith(`${baseHref}${href}`);
          return (
            <Link
              key={href}
              href={fullHref}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-[var(--cf-orange)] text-[var(--cf-orange)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
