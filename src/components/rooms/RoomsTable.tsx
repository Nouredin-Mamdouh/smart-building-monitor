"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Eye, Pencil, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { createRoom, deleteRoom, getRooms, updateRoom } from "@/lib/building-api";
import {
  occupancyBadgeVariant,
  occupancyLabel,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/building-ui";
import { hasPermission } from "@/lib/rbac";
import type { RoomFormInput } from "@/lib/validation";
import type { OccupancyStatus, RoomStatus, RoomWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { Feedback } from "../common/Feedback";
import { Toast } from "../common/Toast";
import { RoomDetailsDrawer } from "./RoomDetailsDrawer";
import { RoomForm } from "./RoomForm";

type SortField = "name" | "floor" | "temperature" | "energyConsumption" | "status";
type SortOrder = "asc" | "desc";

export function RoomsTable() {
  const currentUser = useCurrentUser();
  const canCreateRoom = hasPermission(currentUser.role, "room:create");
  const canUpdateRoom = hasPermission(currentUser.role, "room:update");
  const canDeleteRoom = hasPermission(currentUser.role, "room:delete");
  const [rooms, setRooms] = useState<RoomWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "ALL">("ALL");
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyStatus | "ALL">("ALL");
  const [sortField, setSortField] = useState<SortField>("floor");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editingRoom, setEditingRoom] = useState<RoomWithRelations | null>(null);
  const [viewingRoomId, setViewingRoomId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<RoomWithRelations | null>(null);
  const dismissToast = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    let isMounted = true;

    getRooms()
      .then((data) => {
        if (isMounted) {
          setRooms(data);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load rooms.");
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
          String(room.floor).includes(query);
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

  const handleSubmit = async (input: RoomFormInput) => {
    if ((editingRoom && !canUpdateRoom) || (!editingRoom && !canCreateRoom)) {
      setError("Your role can view rooms but cannot save room changes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      if (editingRoom) {
        const updated = await updateRoom(editingRoom.id, input);
        setRooms((current) => current.map((room) => (room.id === updated.id ? updated : room)));
        setFeedback("Room updated.");
      } else {
        const created = await createRoom(input);
        setRooms((current) => [...current, created]);
        setFeedback("Room created.");
      }

      setIsFormOpen(false);
      setEditingRoom(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRoom || !canDeleteRoom) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteRoom(deletingRoom.id);
      setRooms((current) => current.filter((room) => room.id !== deletingRoom.id));
      setFeedback("Room deleted.");
      setDeletingRoom(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Card>Loading rooms...</Card>;
  }

  return (
    <div className="space-y-6">
      {error && <Feedback type="error" message={error} />}
      <Toast message={feedback} onDismiss={dismissToast} />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search rooms or floors..."
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

            {canCreateRoom && (
              <button
                type="button"
                onClick={() => {
                  setEditingRoom(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus size={15} />
                Add room
              </button>
            )}
          </div>
        </div>
      </Card>

      {isFormOpen && (editingRoom ? canUpdateRoom : canCreateRoom) && (
        <Card title={editingRoom ? "Edit Room" : "Create Room"}>
          <RoomForm
            room={editingRoom}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingRoom(null);
            }}
            onSubmit={handleSubmit}
          />
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {processedRooms.length === 0 ? (
          <EmptyState
            title="No rooms found"
            message={canCreateRoom ? "Create a room or adjust the filters to see room records." : "Adjust the filters to see room records."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4 text-center">
                    <button type="button" onClick={() => handleSort("floor")} className="inline-flex items-center gap-1">
                      Floor <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("temperature")}
                      className="inline-flex items-center gap-1"
                    >
                      Temp <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("energyConsumption")}
                      className="inline-flex items-center gap-1"
                    >
                      Energy <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-center">Occupancy</th>
                  <th className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="inline-flex items-center gap-1"
                    >
                      Status <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-center">Sensors</th>
                  <th className="px-5 py-4 text-center">Alerts</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {processedRooms.map((room) => (
                  <tr key={room.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{room.name}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">Floor {room.floor}</p>
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
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingRoomId(room.id)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                          aria-label={`View ${room.name}`}
                        >
                          <Eye size={15} />
                        </button>
                        {canUpdateRoom && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoom(room);
                              setIsFormOpen(true);
                            }}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            aria-label={`Edit ${room.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {canDeleteRoom && (
                          <button
                            type="button"
                            onClick={() => setDeletingRoom(room)}
                            className="rounded-lg border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
                            aria-label={`Delete ${room.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deletingRoom && (
        <ConfirmDialog
          title="Delete room?"
          message={`This will delete ${deletingRoom.name} and cascade to related sensors and alerts according to the database relation rules.`}
          isBusy={isSubmitting}
          onCancel={() => setDeletingRoom(null)}
          onConfirm={handleDelete}
        />
      )}
      {viewingRoomId && <RoomDetailsDrawer roomId={viewingRoomId} onClose={() => setViewingRoomId(null)} />}
    </div>
  );
}
