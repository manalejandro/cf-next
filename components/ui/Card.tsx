import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingMap = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  accent?: boolean;
}

export function StatCard({ title, value, subtitle, icon, trend, accent }: StatCardProps) {
  return (
    <Card className={accent ? "border-[var(--cf-orange)]/30 bg-gradient-to-br from-[var(--bg-surface)] to-[#1e1208]" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%{trend.label ? ` ${trend.label}` : ""}
            </p>
          )}
        </div>
        {icon && (
          <div className={`shrink-0 rounded-lg p-2.5 ${accent ? "bg-[var(--cf-orange)]/10 text-[var(--cf-orange)]" : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
