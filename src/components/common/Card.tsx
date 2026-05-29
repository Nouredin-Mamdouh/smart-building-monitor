import type { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  statusBorder?: "normal" | "warning" | "critical" | null;
  onClick?: () => void;
}

export function Card({
  title,
  subtitle,
  headerAction,
  footer,
  children,
  className = "",
  statusBorder = null,
  onClick,
}: CardProps) {
  const borderStyle =
    statusBorder === "critical"
      ? "border-l-4 border-l-rose-500 border-y border-r border-slate-200"
      : statusBorder === "warning"
        ? "border-l-4 border-l-amber-500 border-y border-r border-slate-200"
        : statusBorder === "normal"
          ? "border-l-4 border-l-emerald-500 border-y border-r border-slate-200"
          : "border border-slate-200";

  const interactiveStyle = onClick
    ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    : "";

  return (
    <section
      onClick={onClick}
      className={`flex flex-col overflow-hidden rounded-lg bg-white shadow-sm transition ${borderStyle} ${interactiveStyle} ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold tracking-tight text-slate-950">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className="flex-1 p-5">{children}</div>

      {footer && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600">
          {footer}
        </div>
      )}
    </section>
  );
}
