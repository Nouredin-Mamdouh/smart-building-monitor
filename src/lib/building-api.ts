import type { AlertWithRelations, RoomWithRelations } from "@/types/building";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getRooms() {
  return getJson<RoomWithRelations[]>("/api/rooms");
}

export function getAlerts() {
  return getJson<AlertWithRelations[]>("/api/alerts");
}
