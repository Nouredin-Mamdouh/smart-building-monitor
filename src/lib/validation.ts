import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const userRoleSchema = z.enum(["ADMIN", "OPERATOR", "VIEWER"]);

export const roomCreateSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters."),
  floor: z.coerce.number().int().min(1, "Floor must be 1 or higher."),
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

const alertMutationSchema = z.object({
  message: z.string().trim().min(5, "Message must be at least 5 characters."),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  roomId: z.string().uuid("Room is required."),
  sensorId: z.string().uuid().nullable().optional(),
});

export const alertCreateSchema = alertMutationSchema;
export const alertUpdateSchema = alertMutationSchema;

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("A valid email is required.").transform((value) => value.toLowerCase()),
  role: userRoleSchema,
  password: passwordSchema,
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("A valid email is required.").transform((value) => value.toLowerCase()),
  role: userRoleSchema,
  isActive: z.boolean(),
});

export const userPasswordResetSchema = z.object({
  password: passwordSchema,
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
});

export const profilePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, "Confirm your new password."),
}).refine((value) => value.newPassword === value.confirmNewPassword, {
  message: "New passwords must match.",
  path: ["confirmNewPassword"],
});

export type RoomFormInput = z.infer<typeof roomCreateSchema>;
export type SensorFormInput = z.infer<typeof sensorCreateSchema>;
export type AlertFormInput = z.infer<typeof alertMutationSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserPasswordResetInput = z.infer<typeof userPasswordResetSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfilePasswordInput = z.infer<typeof profilePasswordSchema>;
