import { z } from "zod";

export const roomCreateSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters."),
  floor: z.coerce.number().int().min(1, "Floor must be 1 or higher."),
  svgId: z
    .string()
    .trim()
    .min(2, "SVG id is required.")
    .regex(/^[a-zA-Z0-9_-]+$/, "SVG id can only contain letters, numbers, dashes, and underscores."),
  temperature: z.coerce.number().min(-20).max(80),
  occupancyStatus: z.enum(["OCCUPIED", "VACANT"]),
  energyConsumption: z.coerce.number().min(0),
  status: z.enum(["NORMAL", "WARNING", "CRITICAL"]),
});

export const roomUpdateSchema = roomCreateSchema;

export const sensorCreateSchema = z.object({
  name: z.string().trim().min(2, "Sensor name must be at least 2 characters."),
  type: z.enum(["TEMPERATURE", "OCCUPANCY", "ENERGY"]),
  value: z.coerce.number(),
  unit: z.string().trim().min(1, "Unit is required.").max(24),
  status: z.enum(["OK", "WARNING", "CRITICAL", "OFFLINE"]),
  roomId: z.string().uuid("Room is required."),
});

export const sensorUpdateSchema = sensorCreateSchema;

export const alertCreateSchema = z.object({
  message: z.string().trim().min(5, "Message must be at least 5 characters."),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["ACTIVE", "RESOLVED"]),
  roomId: z.string().uuid("Room is required."),
  sensorId: z.string().uuid().nullable().optional(),
});

export const alertUpdateSchema = alertCreateSchema;

export type RoomFormInput = z.infer<typeof roomCreateSchema>;
export type SensorFormInput = z.infer<typeof sensorCreateSchema>;
export type AlertFormInput = z.infer<typeof alertCreateSchema>;
