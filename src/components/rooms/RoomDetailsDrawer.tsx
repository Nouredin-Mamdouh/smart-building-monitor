"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Thermometer, X, Zap } from "lucide-react";
import { getRoom } from "@/lib/building-api";
import {
  alertSeverityLabel,
  alertSeverityVariant,
  alertStatusVariant,
  formatDateTime,
  occupancyBadgeVariant,
  occupancyLabel,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/building-ui";
import type { RoomWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { Feedback } from "../common/Feedback";

export function RoomDetailsDrawer({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) {
  const [room, setRoom] = useState<RoomWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getRoom(roomId)
      .then((data) => {
        if (isMounted) {
          setRoom(data);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load room details.");
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
  }, [roomId]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Room Details</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{room?.name ?? "Loading..."}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close room details"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {isLoading && <p className="text-sm font-medium text-slate-500">Loading room details...</p>}
          {error && <Feedback type="error" message={error} />}

          {room && (
            <>
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusBadgeVariant(room.status)} showDot>
                    {statusLabel(room.status)}
                  </Badge>
                  <Badge variant={occupancyBadgeVariant(room.occupancyStatus)}>
                    {occupancyLabel(room.occupancyStatus)}
                  </Badge>
                  <Badge>Floor {room.floor}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <Thermometer size={16} className="text-slate-400" />
                    <p className="mt-2 font-mono text-lg font-bold text-slate-950">{room.temperature}°C</p>
                    <p className="text-xs font-medium text-slate-500">Temperature</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <Zap size={16} className="text-slate-400" />
                    <p className="mt-2 font-mono text-lg font-bold text-slate-950">{room.energyConsumption} kWh</p>
                    <p className="text-xs font-medium text-slate-500">Energy load</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-950">Sensors</h3>
                <div className="mt-3 divide-y divide-slate-100">
                  {room.sensors.length === 0 ? (
                    <p className="py-3 text-sm text-slate-500">No sensors are assigned to this room.</p>
                  ) : (
                    room.sensors.map((sensor) => (
                      <div key={sensor.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{sensor.name}</p>
                          <p className="text-xs text-slate-500">{sensor.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs font-bold text-slate-700">
                            {sensor.value} {sensor.unit}
                          </p>
                          <p className="text-xs text-slate-500">{sensor.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-950">Alerts</h3>
                <div className="mt-3 space-y-3">
                  {room.alerts.length === 0 ? (
                    <p className="text-sm text-slate-500">No alerts are linked to this room.</p>
                  ) : (
                    room.alerts.map((alert) => (
                      <div key={alert.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={alertSeverityVariant(alert.severity)}>
                            {alertSeverityLabel(alert.severity)}
                          </Badge>
                          <Badge variant={alertStatusVariant(alert.status)}>{alert.status}</Badge>
                          {alert.acknowledgedAt && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                              <AlertTriangle size={12} />
                              Acknowledged
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{alert.message}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(alert.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
