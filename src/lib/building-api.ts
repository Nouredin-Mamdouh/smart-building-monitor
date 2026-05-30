import type { AlertWithRelations, RoomWithRelations, SensorWithRelations } from "@/types/building";
import type { AlertFormInput, RoomFormInput, SensorFormInput } from "@/lib/validation";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? `Request failed for ${path}: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function emitAlertActivityChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("alert-activity-changed"));
  }
}

export function getRooms() {
  return requestJson<RoomWithRelations[]>("/api/rooms");
}

export function getRoom(id: string) {
  return requestJson<RoomWithRelations>(`/api/rooms/${id}`);
}

export function getAlerts() {
  return requestJson<AlertWithRelations[]>("/api/alerts");
}

export function getSensors() {
  return requestJson<SensorWithRelations[]>("/api/sensors");
}

export async function createRoom(input: RoomFormInput) {
  const room = await requestJson<RoomWithRelations>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });

  emitAlertActivityChanged();
  return room;
}

export async function updateRoom(id: string, input: RoomFormInput) {
  const room = await requestJson<RoomWithRelations>(`/api/rooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  emitAlertActivityChanged();
  return room;
}

export async function deleteRoom(id: string) {
  await requestJson<void>(`/api/rooms/${id}`, {
    method: "DELETE",
  });
  emitAlertActivityChanged();
}

export async function createSensor(input: SensorFormInput) {
  const sensor = await requestJson<SensorWithRelations>("/api/sensors", {
    method: "POST",
    body: JSON.stringify(input),
  });

  emitAlertActivityChanged();
  return sensor;
}

export async function updateSensor(id: string, input: SensorFormInput) {
  const sensor = await requestJson<SensorWithRelations>(`/api/sensors/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  emitAlertActivityChanged();
  return sensor;
}

export async function deleteSensor(id: string) {
  await requestJson<void>(`/api/sensors/${id}`, {
    method: "DELETE",
  });
  emitAlertActivityChanged();
}

export async function createAlert(input: AlertFormInput) {
  const alert = await requestJson<AlertWithRelations>("/api/alerts", {
    method: "POST",
    body: JSON.stringify(input),
  });

  emitAlertActivityChanged();
  return alert;
}

export async function updateAlert(id: string, input: AlertFormInput) {
  const alert = await requestJson<AlertWithRelations>(`/api/alerts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  emitAlertActivityChanged();
  return alert;
}

export async function acknowledgeAlert(id: string) {
  const alert = await requestJson<AlertWithRelations>(`/api/alerts/${id}/acknowledge`, {
    method: "POST",
  });

  emitAlertActivityChanged();
  return alert;
}

export async function resolveAlert(id: string) {
  const alert = await requestJson<AlertWithRelations>(`/api/alerts/${id}/resolve`, {
    method: "POST",
  });

  emitAlertActivityChanged();
  return alert;
}

export async function deleteAlert(id: string) {
  await requestJson<void>(`/api/alerts/${id}`, {
    method: "DELETE",
  });
  emitAlertActivityChanged();
}
