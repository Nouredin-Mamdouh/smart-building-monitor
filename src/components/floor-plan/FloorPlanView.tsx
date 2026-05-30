"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Layers, Thermometer, Users, Zap } from "lucide-react";
import { getRooms } from "@/lib/building-api";
import {
  getFloorPlanBox,
  occupancyBadgeVariant,
  occupancyLabel,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/building-ui";
import type { RoomWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

type FloorPlanLayer = "status" | "thermal" | "occupancy";

function roomFillClass(room: RoomWithRelations, activeLayer: FloorPlanLayer, isSelected: boolean) {
  if (activeLayer === "thermal") {
    if (room.temperature >= 30) {
      return isSelected ? "fill-rose-100 stroke-rose-700" : "fill-rose-50 stroke-rose-500";
    }

    if (room.temperature >= 26) {
      return isSelected ? "fill-amber-100 stroke-amber-700" : "fill-amber-50 stroke-amber-500";
    }

    return isSelected ? "fill-emerald-100 stroke-emerald-700" : "fill-emerald-50 stroke-emerald-500";
  }

  if (activeLayer === "occupancy") {
    return room.occupancyStatus === "OCCUPIED"
      ? isSelected
        ? "fill-indigo-100 stroke-indigo-700"
        : "fill-indigo-50 stroke-indigo-500"
      : isSelected
        ? "fill-slate-200 stroke-slate-600"
        : "fill-slate-100 stroke-slate-400";
  }

  if (room.status === "CRITICAL") {
    return isSelected ? "fill-rose-100 stroke-rose-700" : "fill-rose-50 stroke-rose-500";
  }

  if (room.status === "WARNING") {
    return isSelected ? "fill-amber-100 stroke-amber-700" : "fill-amber-50 stroke-amber-500";
  }

  return isSelected ? "fill-emerald-100 stroke-emerald-700" : "fill-emerald-50 stroke-emerald-500";
}

export function FloorPlanView() {
  const searchParams = useSearchParams();
  const requestedRoomId = searchParams.get("roomId");
  const [rooms, setRooms] = useState<RoomWithRelations[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(requestedRoomId);
  const [activeLayer, setActiveLayer] = useState<FloorPlanLayer>("status");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getRooms()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setRooms(data);
        setError(null);

        const requestedRoom = requestedRoomId ? data.find((room) => room.id === requestedRoomId) : null;
        setSelectedRoomId(requestedRoom?.id ?? data[0]?.id ?? null);
        setSelectedFloor(requestedRoom?.floor ?? data[0]?.floor ?? null);
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
  }, [requestedRoomId]);

  const floors = useMemo(() => Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a - b), [rooms]);
  const visibleRooms = rooms.filter((room) => room.floor === selectedFloor);
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;

  if (isLoading) {
    return <Card>Loading floor plan...</Card>;
  }

  if (error) {
    return (
      <Card statusBorder="critical" title="Unable to load floor plan">
        <p className="text-sm text-slate-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
      <Card
        title="Floor Plan"
        subtitle="Select a room to inspect its current conditions."
        headerAction={
          <select
            value={selectedFloor ?? ""}
            onChange={(event) => {
              const floor = Number(event.target.value);
              const firstRoom = rooms.find((room) => room.floor === floor);
              setSelectedFloor(floor);
              setSelectedRoomId(firstRoom?.id ?? null);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            {floors.map((floor) => (
              <option key={floor} value={floor}>
                Floor {floor}
              </option>
            ))}
          </select>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "status", label: "Status", icon: Layers },
            { id: "thermal", label: "Thermal", icon: Thermometer },
            { id: "occupancy", label: "Occupancy", icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeLayer === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveLayer(item.id as FloorPlanLayer)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
          <svg viewBox="0 0 880 420" className="h-auto w-full">
            <defs>
              <pattern id="floorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#floorGrid)" rx="8" />
            <rect x="25" y="25" width="830" height="360" fill="none" stroke="#cbd5e1" strokeWidth="6" rx="6" />
            <rect x="35" y="210" width="810" height="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

            {visibleRooms.map((room, index) => {
              const box = getFloorPlanBox(room, index);
              const isSelected = room.id === selectedRoomId;

              return (
                <g key={room.id} onClick={() => setSelectedRoomId(room.id)} className="cursor-pointer">
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    rx="6"
                    className={`${roomFillClass(room, activeLayer, isSelected)} transition-colors`}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <rect x={box.x + 8} y={box.y + 8} width="58" height="18" rx="4" className="fill-white/80" />
                  <text x={box.x + 37} y={box.y + 21} textAnchor="middle" className="fill-slate-600 text-[9px] font-bold">
                    F{room.floor}
                  </text>
                  <text
                    x={box.x + box.width / 2}
                    y={box.y + box.height / 2 - 8}
                    textAnchor="middle"
                    className="pointer-events-none fill-slate-900 text-xs font-bold"
                  >
                    {room.name.length > 24 ? `${room.name.slice(0, 21)}...` : room.name}
                  </text>
                  <text
                    x={box.x + box.width / 2}
                    y={box.y + box.height / 2 + 14}
                    textAnchor="middle"
                    className="pointer-events-none fill-slate-600 text-[10px] font-bold"
                  >
                    {activeLayer === "thermal" && `${room.temperature}°C`}
                    {activeLayer === "occupancy" && occupancyLabel(room.occupancyStatus)}
                    {activeLayer === "status" && statusLabel(room.status)}
                  </text>
                  {room.alerts.length > 0 && (
                    <>
                      <circle cx={box.x + box.width - 18} cy={box.y + 18} r="8" className="fill-rose-500" />
                      <text
                        x={box.x + box.width - 18}
                        y={box.y + 21}
                        textAnchor="middle"
                        className="pointer-events-none fill-white text-[10px] font-bold"
                      >
                        !
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs font-semibold">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legend</span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded bg-emerald-100 ring-1 ring-emerald-400" />
            Normal
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="h-2.5 w-2.5 rounded bg-amber-100 ring-1 ring-amber-400" />
            Warning
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="h-2.5 w-2.5 rounded bg-rose-100 ring-1 ring-rose-400" />
            Critical or alert
          </span>
        </div>
      </Card>

      <aside className="space-y-4">
        {selectedRoom ? (
          <Card
            title={selectedRoom.name}
            subtitle={`Floor ${selectedRoom.floor}`}
            statusBorder={
              selectedRoom.status === "CRITICAL" ? "critical" : selectedRoom.status === "WARNING" ? "warning" : "normal"
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusBadgeVariant(selectedRoom.status)} showDot>
                  {statusLabel(selectedRoom.status)}
                </Badge>
                <Badge variant={occupancyBadgeVariant(selectedRoom.occupancyStatus)}>
                  {occupancyLabel(selectedRoom.occupancyStatus)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <Thermometer size={16} className="text-slate-400" />
                  <p className="mt-2 font-mono text-lg font-bold text-slate-950">{selectedRoom.temperature}°C</p>
                  <p className="text-xs font-medium text-slate-500">Temperature</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <Zap size={16} className="text-slate-400" />
                  <p className="mt-2 font-mono text-lg font-bold text-slate-950">
                    {selectedRoom.energyConsumption}
                  </p>
                  <p className="text-xs font-medium text-slate-500">kWh</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sensors</p>
                <div className="mt-3 space-y-2">
                  {selectedRoom.sensors.map((sensor) => (
                    <div key={sensor.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{sensor.name}</span>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {sensor.value} {sensor.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRoom.alerts.length > 0 && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
                    <AlertTriangle size={14} />
                    Active alerts
                  </p>
                  <div className="mt-3 space-y-2">
                    {selectedRoom.alerts.map((alert) => (
                      <p key={alert.id} className="text-sm leading-5 text-rose-900">
                        {alert.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card title="No room selected">
            <p className="text-sm text-slate-500">Select a room from the floor plan to inspect its telemetry.</p>
          </Card>
        )}
      </aside>
    </div>
  );
}
