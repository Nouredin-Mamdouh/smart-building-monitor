"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Thermometer,
  Users,
  Zap,
} from "lucide-react";
import { getAlerts, getRooms } from "@/lib/building-api";
import {
  alertSeverityLabel,
  alertSeverityVariant,
  calculateBuildingStats,
  formatDateTime,
  occupancyLabel,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/building-ui";
import type { AlertWithRelations, RoomWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

export function DashboardOverview() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithRelations[]>([]);
  const [alerts, setAlerts] = useState<AlertWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getRooms(), getAlerts()])
      .then(([roomsData, alertsData]) => {
        if (isMounted) {
          setRooms(roomsData);
          setAlerts(alertsData);
          setError(null);
        }
      })
      .catch((requestError: Error) => {
        if (isMounted) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => calculateBuildingStats(rooms, alerts), [rooms, alerts]);
  const occupancyPercent = stats.totalRooms
    ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
    : 0;

  if (isLoading) {
    return <Card>Loading building telemetry...</Card>;
  }

  if (error) {
    return (
      <Card statusBorder="critical" title="Unable to load dashboard">
        <p className="text-sm text-slate-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          title={<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Alerts</span>}
          headerAction={<AlertTriangle size={18} className={stats.activeAlerts > 0 ? "text-rose-500" : "text-slate-400"} />}
          statusBorder={stats.highAlerts > 0 ? "critical" : stats.activeAlerts > 0 ? "warning" : "normal"}
        >
          <div className="flex items-end gap-2">
            <span className="font-mono text-3xl font-bold text-slate-950">{stats.activeAlerts}</span>
            <span className="pb-1 text-xs font-semibold text-slate-500">open</span>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500">
            <span className="font-mono font-bold text-rose-600">{stats.highAlerts}</span> high severity alerts.
          </p>
        </Card>

        <Card
          title={<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Occupancy</span>}
          headerAction={<Users size={18} className="text-slate-400" />}
        >
          <div className="flex items-end gap-2">
            <span className="font-mono text-3xl font-bold text-slate-950">{occupancyPercent}%</span>
            <span className="pb-1 text-xs font-semibold text-slate-500">occupied</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${occupancyPercent}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {stats.occupiedRooms} of {stats.totalRooms} rooms occupied.
          </p>
        </Card>

        <Card
          title={<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Temperature</span>}
          headerAction={<Thermometer size={18} className="text-slate-400" />}
        >
          <span className="font-mono text-3xl font-bold text-slate-950">{stats.averageTemp}°C</span>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {stats.warningRooms} warning rooms, {stats.criticalRooms} critical rooms.
          </p>
        </Card>

        <Card
          title={<span className="text-xs font-bold uppercase tracking-wider text-slate-400">Energy Load</span>}
          headerAction={<Zap size={18} className="text-slate-400" />}
        >
          <div className="flex items-end gap-2">
            <span className="font-mono text-3xl font-bold text-slate-950">{stats.totalEnergy}</span>
            <span className="pb-1 text-xs font-semibold text-slate-500">kWh</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-500"
              style={{ width: `${Math.min((stats.totalEnergy / 100) * 100, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          title="Room Status Matrix"
          subtitle="Current room conditions across monitored floors."
          className="xl:col-span-2"
          headerAction={
            <button
              type="button"
              onClick={() => router.push("/rooms")}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              Rooms
              <ChevronRight size={14} />
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {rooms.map((room) => (
              <button
                type="button"
                key={room.id}
                onClick={() => router.push(`/floor-plan?roomId=${encodeURIComponent(room.id)}`)}
                className="rounded-lg border border-l-4 border-slate-200 bg-slate-50/60 p-4 text-left transition hover:bg-white hover:shadow-sm"
                style={{
                  borderLeftColor:
                    room.status === "CRITICAL" ? "#e11d48" : room.status === "WARNING" ? "#f59e0b" : "#10b981",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{room.name}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">Floor {room.floor}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(room.status)}>{statusLabel(room.status)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <span className="rounded-md bg-white px-2 py-2 font-mono font-semibold text-slate-700">
                    {room.temperature}°C
                  </span>
                  <span className="rounded-md bg-white px-2 py-2 font-semibold text-slate-700">
                    {occupancyLabel(room.occupancyStatus)}
                  </span>
                  <span className="rounded-md bg-white px-2 py-2 font-mono font-semibold text-slate-700">
                    {room.energyConsumption} kWh
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card
          title="Alert Feed"
          subtitle="Recent operational alerts."
          headerAction={
            <button
              type="button"
              onClick={() => router.push("/alerts")}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Open alerts"
            >
              <ArrowUpRight size={17} />
            </button>
          }
        >
          <div className="space-y-3">
            {alerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={alertSeverityVariant(alert.severity)}>
                    {alertSeverityLabel(alert.severity)}
                  </Badge>
                  <span className="text-[10px] font-medium text-slate-400">{formatDateTime(alert.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{alert.room.name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{alert.message}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <Building2 size={18} />
                No alerts to review.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
