"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Menu, UserCircle } from "lucide-react";
import type { CurrentUser } from "@/components/auth/CurrentUserProvider";
import { roleMeta } from "@/lib/rbac";
import type { AlertWithRelations } from "@/types/building";
import { LogoutButton } from "../auth/LogoutButton";
import { AlertNotificationBell } from "./AlertNotificationBell";

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

        <AlertNotificationBell activeAlerts={activeAlerts} />

        <LogoutButton />
      </div>
    </header>
  );
}
