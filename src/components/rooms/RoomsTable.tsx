"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, RefreshCcw, Search } from "lucide-react";
import { getRooms } from "@/lib/building-api";
import {
  occupancyBadgeVariant,
  occupancyLabel,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/building-ui";
import type { OccupancyStatus, RoomStatus, RoomWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";

type SortField = "name" | "floor" | "temperature" | "energyConsumption" | "status";
type SortOrder = "asc" | "desc";

export function RoomsTable() {
  const [rooms, setRooms] = useState<RoomWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "ALL">("ALL");
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyStatus | "ALL">("ALL");
  const [sortField, setSortField] = useState<SortField>("floor");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    let isMounted = true;

    getRooms()
      .then((data) => {
        if (isMounted) {
          setRooms(data);
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

  const floors = useMemo(() => Array.from(new Set(rooms.map((room) => room.floor))).sort((a, b) => a - b), [rooms]);

  const processedRooms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return rooms
      .filter((room) => {
        const matchesSearch =
          !query ||
          room.name.toLowerCase().includes(query) ||
          room.svgId.toLowerCase().includes(query) ||
          room.id.toLowerCase().includes(query);
        const matchesFloor = floorFilter === "ALL" || room.floor === Number(floorFilter);
        const matchesStatus = statusFilter === "ALL" || room.status === statusFilter;
        const matchesOccupancy = occupancyFilter === "ALL" || room.occupancyStatus === occupancyFilter;

        return matchesSearch && matchesFloor && matchesStatus && matchesOccupancy;
      })
      .sort((a, b) => {
        const valueA = a[sortField];
        const valueB = b[sortField];
        const direction = sortOrder === "asc" ? 1 : -1;

        if (typeof valueA === "number" && typeof valueB === "number") {
          return (valueA - valueB) * direction;
        }

        return String(valueA).localeCompare(String(valueB)) * direction;
      });
  }, [floorFilter, occupancyFilter, rooms, searchTerm, sortField, sortOrder, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder(field === "name" || field === "status" ? "asc" : "desc");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFloorFilter("ALL");
    setStatusFilter("ALL");
    setOccupancyFilter("ALL");
  };

  if (isLoading) {
    return <Card>Loading rooms...</Card>;
  }

  if (error) {
    return (
      <Card statusBorder="critical" title="Unable to load rooms">
        <p className="text-sm text-slate-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search rooms, ids, or svg ids..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={floorFilter}
              onChange={(event) => setFloorFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All floors</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  Floor {floor}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as RoomStatus | "ALL")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All statuses</option>
              <option value="NORMAL">Normal</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={occupancyFilter}
              onChange={(event) => setOccupancyFilter(event.target.value as OccupancyStatus | "ALL")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All occupancy</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="VACANT">Vacant</option>
            </select>

            {(searchTerm || floorFilter !== "ALL" || statusFilter !== "ALL" || occupancyFilter !== "ALL") && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                aria-label="Reset filters"
              >
                <RefreshCcw size={15} />
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-5 py-4">Room</th>
                <th className="px-5 py-4 text-center">
                  <button type="button" onClick={() => handleSort("floor")} className="inline-flex items-center gap-1">
                    Floor
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort("temperature")}
                    className="inline-flex items-center gap-1"
                  >
                    Temp
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort("energyConsumption")}
                    className="inline-flex items-center gap-1"
                  >
                    Energy
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-4 text-center">Occupancy</th>
                <th className="px-5 py-4 text-center">
                  <button type="button" onClick={() => handleSort("status")} className="inline-flex items-center gap-1">
                    Status
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-4 text-center">Sensors</th>
                <th className="px-5 py-4 text-center">Active Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {processedRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center font-medium text-slate-400">
                    No rooms match the current filters.
                  </td>
                </tr>
              ) : (
                processedRooms.map((room) => (
                  <tr key={room.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{room.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400">{room.svgId}</p>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-700">{room.floor}</td>
                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-700">
                      {room.temperature}°C
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-700">
                      {room.energyConsumption} kWh
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant={occupancyBadgeVariant(room.occupancyStatus)}>
                        {occupancyLabel(room.occupancyStatus)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant={statusBadgeVariant(room.status)} showDot>
                        {statusLabel(room.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-700">
                      {room.sensors.length}
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-700">
                      {room.alerts.length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
