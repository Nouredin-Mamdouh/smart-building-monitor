"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BellRing,
  Building2,
  Cpu,
  Gauge,
  LayoutDashboard,
  Map,
  TableProperties,
} from "lucide-react";
import type { AlertWithRelations } from "@/types/building";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Floor Plan", href: "/floor-plan", icon: Map },
  { name: "Rooms", href: "/rooms", icon: TableProperties },
  { name: "Sensors", href: "/sensors", icon: Gauge },
  { name: "Alerts", href: "/alerts", icon: BellRing },
];

export function Sidebar({ activeAlerts }: { activeAlerts: AlertWithRelations[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-300 md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-slate-950">
          <Building2 size={19} />
        </div>
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wide text-white">Smart Monitor</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Building Ops</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Control Center</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-l-2 border-teal-400 bg-teal-500/10 text-teal-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} />
                {item.name}
              </span>
              {item.href === "/floor-plan" && activeAlerts.length > 0 && (
                <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  {activeAlerts.length}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-8">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Future API Support</p>
          <div className="mt-2 space-y-1 opacity-70">
            <div className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-500">
              <Cpu size={16} />
              Role-based user management
            </div>
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-800 bg-slate-950 px-4 py-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">REST Gateway</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <Activity size={12} className="text-teal-400" />
            /api/rooms /api/alerts
          </div>
        </div>
      </div>
    </aside>
  );
}
