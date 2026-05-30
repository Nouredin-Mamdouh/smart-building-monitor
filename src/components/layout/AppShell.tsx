"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getAlerts } from "@/lib/building-api";
import type { AlertWithRelations } from "@/types/building";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser();
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<AlertWithRelations[]>([]);

  const refreshAlerts = useCallback(async () => {
    try {
      const data = await getAlerts();
      setAlerts(data.filter((alert) => alert.status === "ACTIVE"));
    } catch {
      setAlerts([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAlerts = async () => {
      try {
        const data = await getAlerts();

        if (isMounted) {
          setAlerts(data.filter((alert) => alert.status === "ACTIVE"));
        }
      } catch {
        if (isMounted) {
          setAlerts([]);
        }
      }
    };

    void loadAlerts();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    const onAlertActivityChanged = () => {
      void refreshAlerts();
    };
    const interval = window.setInterval(() => {
      void refreshAlerts();
    }, 30000);

    window.addEventListener("alert-activity-changed", onAlertActivityChanged);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("alert-activity-changed", onAlertActivityChanged);
    };
  }, [refreshAlerts]);

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
