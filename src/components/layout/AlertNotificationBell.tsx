"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  alertSeverityLabel,
  alertSeverityVariant,
  alertSourceLabel,
  alertSourceVariant,
  groupOperationalAlerts,
  operationalAlertCategoryLabel,
  formatDateTime,
} from "@/lib/building-ui";
import type { AlertWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";

export function AlertNotificationBell({ activeAlerts }: { activeAlerts: AlertWithRelations[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const alertGroups = useMemo(() => groupOperationalAlerts(activeAlerts), [activeAlerts]);
  const unacknowledgedCount = alertGroups.filter((group) => !group.primary.acknowledgedAt).length;
  const visibleGroups = useMemo(() => alertGroups.slice(0, 5), [alertGroups]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`relative rounded-lg border p-2 transition ${
          unacknowledgedCount > 0
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
        aria-label={`Open alert activity, ${unacknowledgedCount} unacknowledged`}
      >
        <Bell size={18} />
        {unacknowledgedCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unacknowledgedCount > 9 ? "9+" : unacknowledgedCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert size={16} className="text-rose-300" />
              Alert Activity
            </span>
            <Badge variant={unacknowledgedCount > 0 ? "error" : "success"}>{unacknowledgedCount}</Badge>
          </div>

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {visibleGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <CheckCircle2 size={26} className="text-emerald-500" />
                <p className="text-sm font-semibold text-slate-800">No active alerts</p>
                <p className="text-xs text-slate-500">All monitored rooms are currently clear.</p>
              </div>
            ) : (
              visibleGroups.map((group) => {
                const alert = group.primary;

                return (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => {
                    router.push(`/floor-plan?roomId=${encodeURIComponent(alert.roomId)}`);
                    setIsOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={alertSeverityVariant(alert.severity)}>
                        {alertSeverityLabel(alert.severity)}
                      </Badge>
                      <Badge variant={alertSourceVariant(alert.source)}>
                        {alertSourceLabel(alert.source)}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{formatDateTime(alert.updatedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{alert.room.name}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {operationalAlertCategoryLabel(group.category)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{alert.message}</p>
                  {group.diagnostics.length > 0 && (
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                      {group.diagnostics.length} supporting signal{group.diagnostics.length === 1 ? "" : "s"}
                    </p>
                  )}
                  {alert.acknowledgedAt && (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Acknowledged</p>
                  )}
                </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
