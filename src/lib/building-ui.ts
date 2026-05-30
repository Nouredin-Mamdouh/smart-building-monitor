import type {
  AlertSeverity,
  AlertSource,
  AlertStatus,
  AlertWithRelations,
  BuildingStats,
  OccupancyStatus,
  RoomStatus,
  RoomWithRelations,
} from "@/types/building";

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "active"
  | "inactive";

export interface FloorPlanBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const floorPlanBoxes: Record<string, FloorPlanBox> = {
  "room-101": { x: 50, y: 55, width: 220, height: 145 },
  "room-102": { x: 295, y: 55, width: 245, height: 145 },
  "room-103": { x: 565, y: 55, width: 255, height: 145 },
  "room-201": { x: 90, y: 235, width: 330, height: 125 },
  "room-202": { x: 460, y: 235, width: 330, height: 125 },
};

export function getFloorPlanBox(room: RoomWithRelations, index: number): FloorPlanBox {
  const knownBox = floorPlanBoxes[room.svgId];

  if (knownBox) {
    return knownBox;
  }

  const column = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: 50 + column * 270,
    y: 55 + row * 150,
    width: 230,
    height: 120,
  };
}

export function calculateBuildingStats(
  rooms: RoomWithRelations[],
  alerts: AlertWithRelations[],
): BuildingStats {
  const activeAlerts = alerts.filter((alert) => alert.status === "ACTIVE");
  const totalTemp = rooms.reduce((sum, room) => sum + room.temperature, 0);
  const totalEnergy = rooms.reduce((sum, room) => sum + room.energyConsumption, 0);

  return {
    totalRooms: rooms.length,
    occupiedRooms: rooms.filter((room) => room.occupancyStatus === "OCCUPIED").length,
    activeAlerts: activeAlerts.length,
    highAlerts: activeAlerts.filter((alert) => alert.severity === "HIGH").length,
    warningRooms: rooms.filter((room) => room.status === "WARNING").length,
    criticalRooms: rooms.filter((room) => room.status === "CRITICAL").length,
    averageTemp: rooms.length ? Number((totalTemp / rooms.length).toFixed(1)) : 0,
    totalEnergy: Number(totalEnergy.toFixed(1)),
  };
}

export function statusLabel(status: RoomStatus) {
  switch (status) {
    case "CRITICAL":
      return "Critical";
    case "WARNING":
      return "Warning";
    case "NORMAL":
    default:
      return "Normal";
  }
}

export function statusBadgeVariant(status: RoomStatus): BadgeVariant {
  switch (status) {
    case "CRITICAL":
      return "error";
    case "WARNING":
      return "warning";
    case "NORMAL":
    default:
      return "success";
  }
}

export function occupancyLabel(status: OccupancyStatus) {
  return status === "OCCUPIED" ? "Occupied" : "Vacant";
}

export function occupancyBadgeVariant(status: OccupancyStatus): BadgeVariant {
  return status === "OCCUPIED" ? "active" : "inactive";
}

export function alertSeverityLabel(severity: AlertSeverity) {
  switch (severity) {
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
    default:
      return "Low";
  }
}

export function alertSeverityVariant(severity: AlertSeverity): BadgeVariant {
  switch (severity) {
    case "HIGH":
      return "error";
    case "MEDIUM":
      return "warning";
    case "LOW":
    default:
      return "info";
  }
}

export function alertStatusVariant(status: AlertStatus): BadgeVariant {
  return status === "ACTIVE" ? "error" : "inactive";
}

export function alertSourceLabel(source: AlertSource) {
  return source === "SYSTEM" ? "System" : "Manual";
}

export function alertSourceVariant(source: AlertSource): BadgeVariant {
  return source === "SYSTEM" ? "active" : "neutral";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
