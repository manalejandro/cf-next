"use client";

import { ReactNode } from "react";
import { useConfig } from "@/components/ConfigProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const { isConfigured } = useConfig();
  const pathname = usePathname();

  // Allow /settings to render even when not configured so the user can add a token
  if (!isConfigured && pathname !== "/settings") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="w-full max-w-md px-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--cf-orange)]">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to CF Next</h1>
          <p className="mt-3 text-[var(--text-secondary)]">
            A modern interface for managing your Cloudflare infrastructure.
            Connect your API token to get started.
          </p>
          <div className="mt-8">
            <Link href="/settings">
              <Button variant="primary" size="lg" className="mx-auto">
                Connect API Token
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-[var(--text-tertiary)]">
            Your API token is stored locally in your browser and is never sent to any third-party server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {isConfigured && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
