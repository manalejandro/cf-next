"use client";

import { ReactNode, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Cpu, Settings, ScrollText, LayoutDashboard } from "lucide-react";

const WORKER_NAV = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/logs", label: "Logs", icon: ScrollText },
];

export default function WorkerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ scriptName: string }>;
}) {
  const pathname = usePathname();
  const { scriptName } = use(params);
  const decodedName = decodeURIComponent(scriptName);
  const baseHref = `/workers/${scriptName}`;

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="mb-6">
        <Link
          href="/workers"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Workers
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cf-orange)]/10">
            <Cpu className="h-5 w-5 text-[var(--cf-orange)]" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-semibold text-[var(--text-primary)]">
              {decodedName}
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">Cloudflare Worker</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {WORKER_NAV.map(({ href, label, icon: Icon }) => {
          const fullHref = `${baseHref}${href}`;
          const active =
            href === ""
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
