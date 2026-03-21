"use client";

import { ReactNode } from "react";

type BadgeVariant = "success" | "error" | "warning" | "info" | "secondary" | "orange";
type BadgeSize = "sm" | "md";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[var(--badge-success-bg)] text-[var(--color-success)] border border-[var(--badge-success-border)]",
  error: "bg-[var(--badge-error-bg)] text-[var(--color-error)] border border-[var(--badge-error-border)]",
  warning: "bg-[var(--badge-warning-bg)] text-[var(--color-warning)] border border-[var(--badge-warning-border)]",
  info: "bg-[var(--badge-info-bg)] text-[var(--color-info)] border border-[var(--badge-info-border)]",
  secondary: "bg-[var(--bg-overlay)] text-[var(--text-secondary)] border border-[var(--border)]",
  orange: "bg-[var(--badge-orange-bg)] text-[var(--cf-orange)] border border-[var(--badge-orange-border)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
};

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  dot?: boolean;
}

export function Badge({ variant = "secondary", size = "sm", children, dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === "success" ? "bg-[var(--color-success)]" :
            variant === "error" ? "bg-[var(--color-error)]" :
            variant === "warning" ? "bg-[var(--color-warning)]" :
            variant === "info" ? "bg-[var(--color-info)]" :
            variant === "orange" ? "bg-[var(--cf-orange)]" :
            "bg-[var(--text-secondary)]"
          }`}
        />
      )}
      {children}
    </span>
  );
}
