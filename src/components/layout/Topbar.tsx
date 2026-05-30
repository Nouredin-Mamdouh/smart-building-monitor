"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Calendar, CheckCircle2, Menu, ShieldAlert, UserCircle } from "lucide-react";
import type { CurrentUser } from "@/components/auth/CurrentUserProvider";
import { alertSeverityLabel, alertSeverityVariant, formatDateTime } from "@/lib/building-ui";
import { roleMeta } from "@/lib/rbac";
import type { AlertWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { LogoutButton } from "../auth/LogoutButton";

function screenCopy(pathname: string) {
  switch (pathname) {
    case "/dashboard":
      return {
        title: "Building Dashboard",
        subtitle: "Real-time room status, occupancy, energy, and alerts.",
      };
    case "/floor-plan":
      return {
        title: "Digital Floor Plan",
        subtitle: "Room conditions mapped to each floor.",
      };
    case "/rooms":
      return {
        title: "Rooms Directory",
        subtitle: "Search and manage monitored rooms.",
      };
    case "/sensors":
      return {
        title: "Sensor Registry",
        subtitle: "Manage sensor assets and their room assignments.",
      };
    case "/alerts":
      return {
        title: "Alert Operations",
        subtitle: "Create, update, resolve, and review operational alerts.",
      };
    case "/access":
      return {
        title: "Access",
        subtitle: "Review team access levels.",
      };
    case "/users":
      return {
        title: "Users",
        subtitle: "Manage internal accounts.",
      };
    case "/profile":
      return {
        title: "Profile",
        subtitle: "Manage your account settings.",
      };
    default:
      return {
        title: "Building Dashboard",
        subtitle: "Real-time room status, occupancy, energy, and alerts.",
      };
  }
}

export function Topbar({
  activeAlerts,
  currentUser,
}: {
  activeAlerts: AlertWithRelations[];
  currentUser: CurrentUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showAlerts, setShowAlerts] = useState(false);
  const copy = screenCopy(pathname);
  const currentRoleMeta = roleMeta[currentUser.role];

  const today = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 md:hidden">
          <Menu size={18} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Smart Monitor</span>
        </div>
        <h2 className="truncate text-lg font-bold tracking-tight text-slate-950">{copy.title}</h2>
        <p className="hidden text-xs font-medium text-slate-500 sm:block">{copy.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 lg:flex">
          <Calendar size={14} />
          {today}
        </div>

        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-3"
        >
          <UserCircle size={15} className="text-slate-500" />
          <span className="hidden max-w-32 truncate lg:block">{currentUser.name}</span>
          <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-bold sm:inline-flex ${currentRoleMeta.badgeClassName}`}>
            {currentRoleMeta.label}
          </span>
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlerts((value) => !value)}
            className={`relative rounded-lg border p-2 transition ${
              activeAlerts.length > 0
                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
            aria-label="Open active alerts"
          >
            <Bell size={18} />
            {activeAlerts.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert size={16} className="text-rose-300" />
                  Active Alerts
                </span>
                <Badge variant={activeAlerts.length > 0 ? "error" : "success"}>{activeAlerts.length}</Badge>
              </div>
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {activeAlerts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                    <CheckCircle2 size={26} className="text-emerald-500" />
                    <p className="text-sm font-semibold text-slate-800">No active alerts</p>
                    <p className="text-xs text-slate-500">All known rooms are currently clear.</p>
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <button
                      type="button"
                      key={alert.id}
                      onClick={() => {
                        router.push(`/floor-plan?roomId=${encodeURIComponent(alert.roomId)}`);
                        setShowAlerts(false);
                      }}
                      className="block w-full px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={alertSeverityVariant(alert.severity)}>
                          {alertSeverityLabel(alert.severity)}
                        </Badge>
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatDateTime(alert.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{alert.room.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{alert.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
