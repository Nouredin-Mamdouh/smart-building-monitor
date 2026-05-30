export type RoomStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type OccupancyStatus = "OCCUPIED" | "VACANT";
export type SensorType = "TEMPERATURE" | "OCCUPANCY" | "ENERGY";
export type SensorStatus = "OK" | "WARNING" | "CRITICAL" | "OFFLINE";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH";
export type AlertStatus = "ACTIVE" | "RESOLVED";
export type AlertSource = "MANUAL" | "SYSTEM";
export type AlertRule = "ROOM_TEMPERATURE" | "ROOM_ENERGY" | "SENSOR_TEMPERATURE" | "SENSOR_ENERGY" | "SENSOR_STATUS";
export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  value: number;
  unit: string;
  status: SensorStatus;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SensorWithRelations extends Sensor {
  room: Room;
}

export interface Alert {
  id: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: AlertSource;
  systemKey: string | null;
  systemRule: AlertRule | null;
  roomId: string;
  sensorId: string | null;
  acknowledgedAt: string | null;
  acknowledgedById: string | null;
  resolvedAt: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  svgId: string;
  temperature: number;
  occupancyStatus: OccupancyStatus;
  energyConsumption: number;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RoomWithRelations extends Room {
  sensors: Sensor[];
  alerts: Alert[];
}

export interface AlertWithRelations extends Alert {
  room: Room;
  sensor: Sensor | null;
  acknowledgedBy?: UserSummary | null;
  resolvedBy?: UserSummary | null;
}

export interface BuildingStats {
  totalRooms: number;
  occupiedRooms: number;
  activeAlerts: number;
  highAlerts: number;
  warningRooms: number;
  criticalRooms: number;
  averageTemp: number;
  totalEnergy: number;
}
