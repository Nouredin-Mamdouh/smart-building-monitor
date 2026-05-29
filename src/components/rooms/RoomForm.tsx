"use client";

import { useState } from "react";
import type { RoomFormInput } from "@/lib/validation";
import type { RoomWithRelations } from "@/types/building";
import { FormField, SelectInput, TextInput } from "../common/FormField";

const defaultValues: RoomFormInput = {
  name: "",
  floor: 1,
  svgId: "",
  temperature: 22,
  occupancyStatus: "VACANT",
  energyConsumption: 0,
  status: "NORMAL",
};

export function RoomForm({
  room,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  room?: RoomWithRelations | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: RoomFormInput) => Promise<void>;
}) {
  const [values, setValues] = useState<RoomFormInput>(
    room
      ? {
          name: room.name,
          floor: room.floor,
          svgId: room.svgId,
          temperature: room.temperature,
          occupancyStatus: room.occupancyStatus,
          energyConsumption: room.energyConsumption,
          status: room.status,
        }
      : defaultValues,
  );

  const setValue = (name: keyof RoomFormInput, value: string | number) => {
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
        <FormField label="Room name">
          <TextInput
            required
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
          />
        </FormField>
        <FormField label="SVG id">
          <TextInput
            required
            value={values.svgId}
            onChange={(event) => setValue("svgId", event.target.value)}
          />
        </FormField>
        <FormField label="Floor">
          <TextInput
            required
            type="number"
            min={1}
            value={values.floor}
            onChange={(event) => setValue("floor", Number(event.target.value))}
          />
        </FormField>
        <FormField label="Temperature">
          <TextInput
            required
            type="number"
            step="0.1"
            value={values.temperature}
            onChange={(event) => setValue("temperature", Number(event.target.value))}
          />
        </FormField>
        <FormField label="Energy consumption">
          <TextInput
            required
            type="number"
            min={0}
            step="0.1"
            value={values.energyConsumption}
            onChange={(event) => setValue("energyConsumption", Number(event.target.value))}
          />
        </FormField>
        <FormField label="Occupancy">
          <SelectInput
            value={values.occupancyStatus}
            onChange={(event) => setValue("occupancyStatus", event.target.value)}
          >
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT">Vacant</option>
          </SelectInput>
        </FormField>
        <FormField label="Status">
          <SelectInput value={values.status} onChange={(event) => setValue("status", event.target.value)}>
            <option value="NORMAL">Normal</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </SelectInput>
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
          disabled={isSubmitting}
          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save room"}
        </button>
      </div>
    </form>
  );
}
