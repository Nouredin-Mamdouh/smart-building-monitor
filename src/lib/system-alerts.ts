import { AlertSeverity, AlertRule, Prisma, RoomStatus, SensorStatus, SensorType } from "@prisma/client";
import { prisma } from "./prisma";

type SystemCondition = {
  key: string;
  rule: AlertRule;
  roomId: string;
  sensorId?: string | null;
  severity: AlertSeverity;
  message: string;
};

const severityRank: Record<AlertSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

function temperatureCondition(value: number) {
  if (value >= 30) {
    return {
      severity: "HIGH" as const,
      message: "Temperature is above normal range.",
    };
  }

  if (value <= 15) {
    return {
      severity: "HIGH" as const,
      message: "Temperature is below normal range.",
    };
  }

  if (value >= 26) {
    return {
      severity: "MEDIUM" as const,
      message: "Temperature is above normal range.",
    };
  }

  if (value < 18) {
    return {
      severity: "MEDIUM" as const,
      message: "Temperature is below normal range.",
    };
  }

  return null;
}

function energyCondition(value: number) {
  if (value >= 25) {
    return {
      severity: "HIGH" as const,
      message: "Energy usage is above normal range.",
    };
  }

  if (value >= 18) {
    return {
      severity: "MEDIUM" as const,
      message: "Energy usage is above normal range.",
    };
  }

  return null;
}

function sensorStatusCondition(status: SensorStatus) {
  if (status === "CRITICAL" || status === "OFFLINE") {
    return {
      severity: "HIGH" as const,
      message: "Sensor is reporting an abnormal status.",
    };
  }

  if (status === "WARNING") {
    return {
      severity: "MEDIUM" as const,
      message: "Sensor is reporting an abnormal status.",
    };
  }

  return null;
}

function roomTemperatureKey(roomId: string) {
  return `room:${roomId}:temperature`;
}

function roomEnergyKey(roomId: string) {
  return `room:${roomId}:energy`;
}

function sensorTemperatureKey(sensorId: string) {
  return `sensor:${sensorId}:temperature`;
}

function sensorEnergyKey(sensorId: string) {
  return `sensor:${sensorId}:energy`;
}

function sensorStatusKey(sensorId: string) {
  return `sensor:${sensorId}:status`;
}

async function reconcileSystemAlert(condition: SystemCondition | null, key: string, rule: AlertRule) {
  const existingAlert = await prisma.alert.findFirst({
    where: {
      source: "SYSTEM",
      status: "ACTIVE",
      systemKey: key,
    },
  });

  if (!condition) {
    if (existingAlert) {
      await prisma.alert.update({
        where: {
          id: existingAlert.id,
        },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolvedById: null,
        },
      });
    }

    return;
  }

  if (existingAlert) {
    const didEscalate = severityRank[condition.severity] > severityRank[existingAlert.severity];

    await prisma.alert.update({
      where: {
        id: existingAlert.id,
      },
      data: {
        message: condition.message,
        severity: condition.severity,
        roomId: condition.roomId,
        sensorId: condition.sensorId ?? null,
        systemRule: rule,
        ...(didEscalate
          ? {
              acknowledgedAt: null,
              acknowledgedById: null,
            }
          : {}),
      },
    });

    return;
  }

  try {
    await prisma.alert.create({
      data: {
        message: condition.message,
        severity: condition.severity,
        status: "ACTIVE",
        source: "SYSTEM",
        systemKey: key,
        systemRule: rule,
        roomId: condition.roomId,
        sensorId: condition.sensorId ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await reconcileSystemAlert(condition, key, rule);
      return;
    }

    throw error;
  }
}

function roomTemperatureCondition(room: { id: string; temperature: number }): SystemCondition | null {
  const condition = temperatureCondition(room.temperature);

  if (!condition) {
    return null;
  }

  return {
    key: roomTemperatureKey(room.id),
    rule: "ROOM_TEMPERATURE",
    roomId: room.id,
    severity: condition.severity,
    message: condition.message,
  };
}

function roomEnergyCondition(room: { id: string; energyConsumption: number }): SystemCondition | null {
  const condition = energyCondition(room.energyConsumption);

  if (!condition) {
    return null;
  }

  return {
    key: roomEnergyKey(room.id),
    rule: "ROOM_ENERGY",
    roomId: room.id,
    severity: condition.severity,
    message: condition.message,
  };
}

function sensorTemperatureCondition(sensor: { id: string; roomId: string; type: SensorType; value: number }): SystemCondition | null {
  if (sensor.type !== "TEMPERATURE") {
    return null;
  }

  const condition = temperatureCondition(sensor.value);

  if (!condition) {
    return null;
  }

  return {
    key: sensorTemperatureKey(sensor.id),
    rule: "SENSOR_TEMPERATURE",
    roomId: sensor.roomId,
    sensorId: sensor.id,
    severity: condition.severity,
    message: condition.message,
  };
}

function sensorEnergyCondition(sensor: { id: string; roomId: string; type: SensorType; value: number }): SystemCondition | null {
  if (sensor.type !== "ENERGY") {
    return null;
  }

  const condition = energyCondition(sensor.value);

  if (!condition) {
    return null;
  }

  return {
    key: sensorEnergyKey(sensor.id),
    rule: "SENSOR_ENERGY",
    roomId: sensor.roomId,
    sensorId: sensor.id,
    severity: condition.severity,
    message: condition.message,
  };
}

function sensorStatusSystemCondition(sensor: { id: string; roomId: string; status: SensorStatus }): SystemCondition | null {
  const condition = sensorStatusCondition(sensor.status);

  if (!condition) {
    return null;
  }

  return {
    key: sensorStatusKey(sensor.id),
    rule: "SENSOR_STATUS",
    roomId: sensor.roomId,
    sensorId: sensor.id,
    severity: condition.severity,
    message: condition.message,
  };
}

export async function syncRoomSystemAlerts(roomId: string) {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });

  if (!room) {
    return;
  }

  await reconcileSystemAlert(roomTemperatureCondition(room), roomTemperatureKey(room.id), "ROOM_TEMPERATURE");
  await reconcileSystemAlert(roomEnergyCondition(room), roomEnergyKey(room.id), "ROOM_ENERGY");
  await syncRoomOperationalStatus(room.id);
}

export async function syncSensorSystemAlerts(sensorId: string) {
  const sensor = await prisma.sensor.findUnique({
    where: {
      id: sensorId,
    },
  });

  if (!sensor) {
    return;
  }

  await reconcileSystemAlert(sensorTemperatureCondition(sensor), sensorTemperatureKey(sensor.id), "SENSOR_TEMPERATURE");
  await reconcileSystemAlert(sensorEnergyCondition(sensor), sensorEnergyKey(sensor.id), "SENSOR_ENERGY");
  await reconcileSystemAlert(sensorStatusSystemCondition(sensor), sensorStatusKey(sensor.id), "SENSOR_STATUS");
  await syncRoomOperationalStatus(sensor.roomId);
}

export async function resolveSensorSystemAlerts(sensorId: string) {
  const now = new Date();

  await prisma.alert.updateMany({
    where: {
      source: "SYSTEM",
      status: "ACTIVE",
      systemKey: {
        in: [sensorTemperatureKey(sensorId), sensorEnergyKey(sensorId), sensorStatusKey(sensorId)],
      },
    },
    data: {
      status: "RESOLVED",
      resolvedAt: now,
      resolvedById: null,
    },
  });
}

export async function syncRoomOperationalStatus(roomId: string) {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      sensors: true,
      alerts: {
        where: {
          status: "ACTIVE",
        },
      },
    },
  });

  if (!room) {
    return;
  }

  const roomTemperature = temperatureCondition(room.temperature);
  const roomEnergy = energyCondition(room.energyConsumption);
  const sensorConditions = room.sensors
    .flatMap((sensor) => [
      sensorTemperatureCondition(sensor),
      sensorEnergyCondition(sensor),
      sensorStatusSystemCondition(sensor),
    ])
    .filter((condition): condition is SystemCondition => Boolean(condition));
  const activeSeverities = [
    roomTemperature?.severity,
    roomEnergy?.severity,
    ...sensorConditions.map((condition) => condition.severity),
    ...room.alerts.map((alert) => alert.severity),
  ].filter((severity): severity is AlertSeverity => Boolean(severity));

  const nextStatus: RoomStatus = activeSeverities.some((severity) => severity === "HIGH")
    ? "CRITICAL"
    : activeSeverities.some((severity) => severity === "MEDIUM")
      ? "WARNING"
      : "NORMAL";

  if (room.status !== nextStatus) {
    await prisma.room.update({
      where: {
        id: room.id,
      },
      data: {
        status: nextStatus,
      },
    });
  }
}

export async function syncAllSystemAlerts() {
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
    },
  });
  const sensors = await prisma.sensor.findMany({
    select: {
      id: true,
    },
  });

  for (const room of rooms) {
    await syncRoomSystemAlerts(room.id);
  }

  for (const sensor of sensors) {
    await syncSensorSystemAlerts(sensor.id);
  }
}
