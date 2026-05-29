export type RoomStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type OccupancyStatus = "OCCUPIED" | "VACANT";
export type SensorType = "TEMPERATURE" | "OCCUPANCY" | "ENERGY";
export type SensorStatus = "OK" | "WARNING" | "CRITICAL" | "OFFLINE";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH";
export type AlertStatus = "ACTIVE" | "RESOLVED";

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

export interface Alert {
  id: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  roomId: string;
  sensorId: string | null;
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
