import type {
  Alert,
  AlertSeverity,
  AlertSource,
  AlertStatus,
  AlertWithRelations,
  BuildingStats,
  OccupancyStatus,
  RoomStatus,
  RoomWithRelations,
  SensorType,
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

export type OperationalAlertCategory = "temperature" | "energy" | "sensor-health" | "standalone";

type AlertLike = Alert & {
  sensor?: {
    type?: SensorType;
  } | null;
};

export interface OperationalAlertGroup<TAlert extends Alert = Alert> {
  id: string;
  key: string;
  category: OperationalAlertCategory;
  primary: TAlert;
  diagnostics: TAlert[];
  alerts: TAlert[];
  isStandalone: boolean;
}

const severityRank: Record<AlertSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

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

function classifyAlertIssue(alert: AlertLike): OperationalAlertCategory | null {
  switch (alert.systemRule) {
    case "ROOM_TEMPERATURE":
    case "SENSOR_TEMPERATURE":
      return "temperature";
    case "ROOM_ENERGY":
    case "SENSOR_ENERGY":
      return "energy";
    case "SENSOR_STATUS":
      return "sensor-health";
    default:
      break;
  }

  if (alert.source === "SYSTEM") {
    if (alert.systemKey?.includes(":temperature")) {
      return "temperature";
    }

    if (alert.systemKey?.includes(":energy")) {
      return "energy";
    }

    if (alert.systemKey?.includes(":status")) {
      return "sensor-health";
    }

    if (alert.sensor?.type === "TEMPERATURE") {
      return "temperature";
    }

    if (alert.sensor?.type === "ENERGY") {
      return "energy";
    }
  }

  const message = alert.message.toLowerCase();

  if (/\b(temperature|thermal|overheating|heat|hot|cold|cooling|hvac)\b/.test(message)) {
    return "temperature";
  }

  if (/\b(energy|power|load|kwh|consumption|electric|usage)\b/.test(message)) {
    return "energy";
  }

  if (/\b(offline|sensor health|sensor status|abnormal status|sensor fault|sensor failure|disconnected)\b/.test(message)) {
    return "sensor-health";
  }

  return null;
}

function isRoomLevelSystemAlert(alert: Alert) {
  return alert.source === "SYSTEM" && (alert.systemRule?.startsWith("ROOM_") || !alert.sensorId);
}

export function compareOperationalAlerts(first: Alert, second: Alert) {
  if (first.status !== second.status) {
    return first.status === "ACTIVE" ? -1 : 1;
  }

  if (Boolean(first.acknowledgedAt) !== Boolean(second.acknowledgedAt)) {
    return first.acknowledgedAt ? 1 : -1;
  }

  const severityDelta = severityRank[second.severity] - severityRank[first.severity];

  if (severityDelta !== 0) {
    return severityDelta;
  }

  if (isRoomLevelSystemAlert(first) !== isRoomLevelSystemAlert(second)) {
    return isRoomLevelSystemAlert(first) ? -1 : 1;
  }

  return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
}

export function groupOperationalAlerts<TAlert extends AlertLike>(alerts: TAlert[]): OperationalAlertGroup<TAlert>[] {
  const groups = new Map<string, OperationalAlertGroup<TAlert>>();

  for (const alert of alerts) {
    const category = classifyAlertIssue(alert);
    const isStandalone = !category;
    const groupCategory = category ?? "standalone";
    const key = isStandalone ? `standalone:${alert.id}` : `${alert.roomId}:${groupCategory}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.alerts.push(alert);
    } else {
      groups.set(key, {
        id: key,
        key,
        category: groupCategory,
        primary: alert,
        diagnostics: [],
        alerts: [alert],
        isStandalone,
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => {
      const sortedAlerts = [...group.alerts].sort(compareOperationalAlerts);
      const primary = sortedAlerts[0];

      return {
        ...group,
        primary,
        diagnostics: group.isStandalone ? [] : sortedAlerts.slice(1),
        alerts: sortedAlerts,
      };
    })
    .sort((first, second) => compareOperationalAlerts(first.primary, second.primary));
}

export function getPrimaryOperationalAlerts<TAlert extends AlertLike>(alerts: TAlert[]) {
  return groupOperationalAlerts(alerts).map((group) => group.primary);
}

export function operationalAlertCategoryLabel(category: OperationalAlertCategory) {
  switch (category) {
    case "temperature":
      return "Temperature issue";
    case "energy":
      return "Energy issue";
    case "sensor-health":
      return "Sensor health issue";
    case "standalone":
    default:
      return "Operational alert";
  }
}

export function calculateBuildingStats(
  rooms: RoomWithRelations[],
  alerts: AlertWithRelations[],
): BuildingStats {
  const activeAlerts = alerts.filter((alert) => alert.status === "ACTIVE");
  const primaryActiveAlerts = getPrimaryOperationalAlerts(activeAlerts);
  const totalTemp = rooms.reduce((sum, room) => sum + room.temperature, 0);
  const totalEnergy = rooms.reduce((sum, room) => sum + room.energyConsumption, 0);

  return {
    totalRooms: rooms.length,
    occupiedRooms: rooms.filter((room) => room.occupancyStatus === "OCCUPIED").length,
    activeAlerts: primaryActiveAlerts.length,
    highAlerts: primaryActiveAlerts.filter((alert) => alert.severity === "HIGH").length,
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
