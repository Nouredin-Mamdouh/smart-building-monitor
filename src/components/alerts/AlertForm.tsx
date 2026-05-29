"use client";

import { useMemo, useState } from "react";
import type { AlertFormInput } from "@/lib/validation";
import type { AlertWithRelations, RoomWithRelations, SensorWithRelations } from "@/types/building";
import { FormField, SelectInput, TextArea } from "../common/FormField";

export function AlertForm({
  alert,
  rooms,
  sensors,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  alert?: AlertWithRelations | null;
  rooms: RoomWithRelations[];
  sensors: SensorWithRelations[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: AlertFormInput) => Promise<void>;
}) {
  const firstRoomId = rooms[0]?.id ?? "";
  const [values, setValues] = useState<AlertFormInput>({
    message: alert?.message ?? "",
    severity: alert?.severity ?? "MEDIUM",
    status: alert?.status ?? "ACTIVE",
    roomId: alert?.roomId ?? firstRoomId,
    sensorId: alert?.sensorId ?? null,
  });

  const roomSensors = useMemo(
    () => sensors.filter((sensor) => sensor.roomId === values.roomId),
    [sensors, values.roomId],
  );

  const setValue = (name: keyof AlertFormInput, value: string | null) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(values);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Room">
          <SelectInput
            required
            value={values.roomId}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                roomId: event.target.value,
                sensorId: null,
              }));
            }}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Sensor">
          <SelectInput
            value={values.sensorId ?? ""}
            onChange={(event) => setValue("sensorId", event.target.value || null)}
          >
            <option value="">No sensor</option>
            {roomSensors.map((sensor) => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.name}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Severity">
          <SelectInput value={values.severity} onChange={(event) => setValue("severity", event.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </SelectInput>
        </FormField>
        <FormField label="Status">
          <SelectInput value={values.status} onChange={(event) => setValue("status", event.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
          </SelectInput>
        </FormField>
      </div>

      <FormField label="Message">
        <TextArea
          required
          rows={4}
          value={values.message}
          onChange={(event) => setValue("message", event.target.value)}
        />
      </FormField>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || rooms.length === 0}
          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save alert"}
        </button>
      </div>
    </form>
  );
}
