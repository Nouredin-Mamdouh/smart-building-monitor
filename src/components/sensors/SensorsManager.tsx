"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { createSensor, deleteSensor, getRooms, getSensors, updateSensor } from "@/lib/building-api";
import { hasPermission } from "@/lib/rbac";
import type { SensorFormInput } from "@/lib/validation";
import type { RoomWithRelations, SensorWithRelations } from "@/types/building";
import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { Feedback } from "../common/Feedback";
import { SensorForm } from "./SensorForm";

function sensorVariant(status: SensorWithRelations["status"]) {
  if (status === "CRITICAL") return "error";
  if (status === "WARNING") return "warning";
  if (status === "OFFLINE") return "inactive";
  return "success";
}

export function SensorsManager() {
  const currentUser = useCurrentUser();
  const canCreateSensor = hasPermission(currentUser.role, "sensor:create");
  const canUpdateSensor = hasPermission(currentUser.role, "sensor:update");
  const canDeleteSensor = hasPermission(currentUser.role, "sensor:delete");
  const canMutateSensors = canCreateSensor || canUpdateSensor || canDeleteSensor;
  const [sensors, setSensors] = useState<SensorWithRelations[]>([]);
  const [rooms, setRooms] = useState<RoomWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState("ALL");
  const [editingSensor, setEditingSensor] = useState<SensorWithRelations | null>(null);
  const [deletingSensor, setDeletingSensor] = useState<SensorWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSensors(), getRooms()])
      .then(([sensorData, roomData]) => {
        if (isMounted) {
          setSensors(sensorData);
          setRooms(roomData);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load sensors.");
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

  const visibleSensors = useMemo(() => {
    if (roomFilter === "ALL") {
      return sensors;
    }

    return sensors.filter((sensor) => sensor.roomId === roomFilter);
  }, [roomFilter, sensors]);

  const handleSubmit = async (input: SensorFormInput) => {
    if ((editingSensor && !canUpdateSensor) || (!editingSensor && !canCreateSensor)) {
      setError("Your role can view sensors but cannot save sensor changes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      if (editingSensor) {
        const updated = await updateSensor(editingSensor.id, input);
        setSensors((current) => current.map((sensor) => (sensor.id === updated.id ? updated : sensor)));
        setFeedback("Sensor updated.");
      } else {
        const created = await createSensor(input);
        setSensors((current) => [created, ...current]);
        setFeedback("Sensor created.");
      }

      setEditingSensor(null);
      setIsFormOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save sensor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSensor || !canDeleteSensor) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteSensor(deletingSensor.id);
      setSensors((current) => current.filter((sensor) => sensor.id !== deletingSensor.id));
      setFeedback("Sensor deleted.");
      setDeletingSensor(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete sensor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Card>Loading sensors...</Card>;
  }

  return (
    <div className="space-y-6">
      {error && <Feedback type="error" message={error} />}
      {feedback && <Feedback type="success" message={feedback} />}
      {!canMutateSensors && (
        <Feedback type="info" message="Your role has read-only access to sensors. Sensor changes require an admin." />
      )}

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={roomFilter}
            onChange={(event) => setRoomFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All rooms</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          {canCreateSensor && (
            <button
              type="button"
              onClick={() => {
                setEditingSensor(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={15} />
              Add sensor
            </button>
          )}
        </div>
      </Card>

      {isFormOpen && (editingSensor ? canUpdateSensor : canCreateSensor) && (
        <Card title={editingSensor ? "Edit Sensor" : "Create Sensor"}>
          <SensorForm
            sensor={editingSensor}
            rooms={rooms}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setEditingSensor(null);
              setIsFormOpen(false);
            }}
            onSubmit={handleSubmit}
          />
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {visibleSensors.length === 0 ? (
          <EmptyState
            title="No sensors found"
            message={canCreateSensor ? "Create a sensor or change the room filter." : "Change the room filter to inspect sensors."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-4">Sensor</th>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4 text-center">Type</th>
                  <th className="px-5 py-4 text-center">Value</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  {canMutateSensors && <th className="px-5 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleSensors.map((sensor) => (
                  <tr key={sensor.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-900">{sensor.name}</td>
                    <td className="px-5 py-4 text-slate-600">{sensor.room.name}</td>
                    <td className="px-5 py-4 text-center font-semibold text-slate-600">{sensor.type}</td>
                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-700">
                      {sensor.value} {sensor.unit}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant={sensorVariant(sensor.status)} showDot>
                        {sensor.status}
                      </Badge>
                    </td>
                    {canMutateSensors && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canUpdateSensor && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSensor(sensor);
                                setIsFormOpen(true);
                              }}
                              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                              aria-label={`Edit ${sensor.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {canDeleteSensor && (
                            <button
                              type="button"
                              onClick={() => setDeletingSensor(sensor)}
                              className="rounded-lg border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
                              aria-label={`Delete ${sensor.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deletingSensor && (
        <ConfirmDialog
          title="Delete sensor?"
          message={`This deletes ${deletingSensor.name}. Existing alerts keep their history with sensorId set to null by the database relation.`}
          isBusy={isSubmitting}
          onCancel={() => setDeletingSensor(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
