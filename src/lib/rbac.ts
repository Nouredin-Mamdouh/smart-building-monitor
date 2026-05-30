export type AppRole = "ADMIN" | "OPERATOR" | "VIEWER";

export type Permission =
  | "room:create"
  | "room:update"
  | "room:delete"
  | "sensor:create"
  | "sensor:update"
  | "sensor:delete"
  | "alert:create"
  | "alert:update"
  | "alert:delete";

export const roleMeta: Record<AppRole, { label: string; description: string; badgeClassName: string }> = {
  ADMIN: {
    label: "System Admin",
    description: "Full access to rooms, sensors, alerts, and operational configuration.",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
  },
  OPERATOR: {
    label: "Operator",
    description: "Can manage operational alerts and inspect all building telemetry.",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access to building telemetry and active alert status.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
};

const permissionMap: Record<AppRole, Set<Permission>> = {
  ADMIN: new Set([
    "room:create",
    "room:update",
    "room:delete",
    "sensor:create",
    "sensor:update",
    "sensor:delete",
    "alert:create",
    "alert:update",
    "alert:delete",
  ]),
  OPERATOR: new Set(["alert:create", "alert:update"]),
  VIEWER: new Set(),
};

export function isAppRole(value: unknown): value is AppRole {
  return value === "ADMIN" || value === "OPERATOR" || value === "VIEWER";
}

export function hasPermission(role: string | undefined, permission: Permission) {
  if (!isAppRole(role)) {
    return false;
  }

  return permissionMap[role].has(permission);
}
