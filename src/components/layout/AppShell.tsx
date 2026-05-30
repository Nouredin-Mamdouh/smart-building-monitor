"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getAlerts } from "@/lib/building-api";
import type { AlertWithRelations } from "@/types/building";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser();
  const [alerts, setAlerts] = useState<AlertWithRelations[]>([]);

  useEffect(() => {
    let isMounted = true;

    getAlerts()
      .then((data) => {
        if (isMounted) {
          setAlerts(data.filter((alert) => alert.status === "ACTIVE"));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAlerts([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activeAlerts={alerts} currentUser={currentUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar activeAlerts={alerts} currentUser={currentUser} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
