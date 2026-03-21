"use client";

import { ReactNode } from "react";

type BadgeVariant = "success" | "error" | "warning" | "info" | "secondary" | "orange";
type BadgeSize = "sm" | "md";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[#1a3d2b] text-[var(--color-success)] border border-[#2d6a4a]",
  error: "bg-[#3d1a1a] text-[var(--color-error)] border border-[#6a2d2d]",
  warning: "bg-[#3d2d0a] text-[var(--color-warning)] border border-[#6a4d1a]",
  info: "bg-[#1a2d3d] text-[var(--color-info)] border border-[#2d4a6a]",
  secondary: "bg-[var(--bg-overlay)] text-[var(--text-secondary)] border border-[var(--border)]",
  orange: "bg-[#3d1e0a] text-[var(--cf-orange)] border border-[#6a3d1a]",
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
