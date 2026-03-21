"use client";

import { Activity, Construction } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export default function ActivityPage() {
  return (
    <div>
      <PageHeader
        title="Activity"
        description="Recent audit logs and API activity across your zones"
      />

      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--cf-orange-muted)" }}
        >
          <Activity className="h-8 w-8" style={{ color: "var(--cf-orange)" }} />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
          Activity Log
        </h3>
        <p className="mb-4 max-w-sm text-sm text-[var(--text-tertiary)]">
          Audit log access requires an Enterprise plan. This feature will display recent API
          calls, zone changes, and security events when available.
        </p>
        <div
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-tertiary)]"
        >
          <Construction className="h-3.5 w-3.5" />
          Coming soon for supported plans
        </div>
      </Card>
    </div>
  );
}
