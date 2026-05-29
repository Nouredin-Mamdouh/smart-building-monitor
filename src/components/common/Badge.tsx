import type { ReactNode } from "react";
import type { BadgeVariant } from "@/lib/building-ui";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  showDot?: boolean;
}

const variantClasses: Record<BadgeVariant, { pill: string; dot: string }> = {
  success: {
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  warning: {
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  error: {
    pill: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  info: {
    pill: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  neutral: {
    pill: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  active: {
    pill: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  inactive: {
    pill: "border-slate-200 bg-slate-50 text-slate-500",
    dot: "bg-slate-400",
  },
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
  showDot = false,
}: BadgeProps) {
  const classes = variantClasses[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${classes.pill} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />}
      {children}
    </span>
  );
}
