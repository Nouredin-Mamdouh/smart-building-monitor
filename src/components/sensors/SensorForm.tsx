"use client";

import { useMemo, useState } from "react";
import type { SensorFormInput } from "@/lib/validation";
import type { RoomWithRelations, SensorWithRelations } from "@/types/building";
import { FormField, SelectInput, TextInput } from "../common/FormField";

export function SensorForm({
  sensor,
  rooms,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  sensor?: SensorWithRelations | null;
  rooms: RoomWithRelations[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: SensorFormInput) => Promise<void>;
}) {
  const firstRoomId = rooms[0]?.id ?? "";
  const [values, setValues] = useState<SensorFormInput>({
    name: sensor?.name ?? "",
    type: sensor?.type ?? "TEMPERATURE",
    value: sensor?.value ?? 0,
    unit: sensor?.unit ?? "°C",
    status: sensor?.status ?? "OK",
    roomId: sensor?.roomId ?? firstRoomId,
  });

  const suggestedUnit = useMemo(() => {
    if (values.type === "TEMPERATURE") return "°C";
    if (values.type === "OCCUPANCY") return "bool";
    return "kWh";
  }, [values.type]);

  const setValue = (name: keyof SensorFormInput, value: string | number) => {
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
        <FormField label="Sensor name">
          <TextInput required value={values.name} onChange={(event) => setValue("name", event.target.value)} />
        </FormField>
        <FormField label="Room">
          <SelectInput required value={values.roomId} onChange={(event) => setValue("roomId", event.target.value)}>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Type">
          <SelectInput
            value={values.type}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                type: event.target.value as SensorFormInput["type"],
                unit: suggestedUnit,
              }));
            }}
          >
            <option value="TEMPERATURE">Temperature</option>
            <option value="OCCUPANCY">Occupancy</option>
            <option value="ENERGY">Energy</option>
          </SelectInput>
        </FormField>
        <FormField label="Status">
          <SelectInput value={values.status} onChange={(event) => setValue("status", event.target.value)}>
            <option value="OK">OK</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
            <option value="OFFLINE">Offline</option>
          </SelectInput>
        </FormField>
        <FormField label="Value">
          <TextInput
            required
            type="number"
            step="0.1"
            value={values.value}
            onChange={(event) => setValue("value", Number(event.target.value))}
          />
        </FormField>
        <FormField label="Unit">
          <TextInput required value={values.unit} onChange={(event) => setValue("unit", event.target.value)} />
        </FormField>
      </div>

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
          {isSubmitting ? "Saving..." : "Save sensor"}
        </button>
      </div>
    </form>
  );
}
