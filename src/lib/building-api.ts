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

export function createRoom(input: RoomFormInput) {
  return requestJson<RoomWithRelations>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateRoom(id: string, input: RoomFormInput) {
  return requestJson<RoomWithRelations>(`/api/rooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteRoom(id: string) {
  return requestJson<void>(`/api/rooms/${id}`, {
    method: "DELETE",
  });
}

export function createSensor(input: SensorFormInput) {
  return requestJson<SensorWithRelations>("/api/sensors", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSensor(id: string, input: SensorFormInput) {
  return requestJson<SensorWithRelations>(`/api/sensors/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteSensor(id: string) {
  return requestJson<void>(`/api/sensors/${id}`, {
    method: "DELETE",
  });
}

export function createAlert(input: AlertFormInput) {
  return requestJson<AlertWithRelations>("/api/alerts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAlert(id: string, input: AlertFormInput) {
  return requestJson<AlertWithRelations>(`/api/alerts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function acknowledgeAlert(id: string) {
  return requestJson<AlertWithRelations>(`/api/alerts/${id}/acknowledge`, {
    method: "POST",
  });
}

export function resolveAlert(id: string) {
  return requestJson<AlertWithRelations>(`/api/alerts/${id}/resolve`, {
    method: "POST",
  });
}

export function deleteAlert(id: string) {
  return requestJson<void>(`/api/alerts/${id}`, {
    method: "DELETE",
  });
}
