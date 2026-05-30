import { prisma } from "@/lib/prisma";
import { apiError, forbidden, noContent, ok, unauthorized, validationError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-users";
import { hasPermission } from "@/lib/rbac";
import { syncRoomOperationalStatus } from "@/lib/system-alerts";
import { alertUpdateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const alertInclude = {
  room: true,
  sensor: true,
  acknowledgedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  resolvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

async function validateAlertRelations(roomId: string, sensorId?: string | null) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return "Selected room does not exist.";
  }

  if (sensorId) {
    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
    });

    if (!sensor || sensor.roomId !== roomId) {
      return "Selected sensor must belong to the selected room.";
    }
  }

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const alert = await prisma.alert.findUnique({
    where: { id },
    include: alertInclude,
  });

  if (!alert) {
    return apiError("Alert not found.", 404);
  }

  return ok(alert);
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasPermission(user.role, "alert:update")) {
    return forbidden();
  }

  const { id } = await context.params;
  const parsed = alertUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const existingAlert = await prisma.alert.findUnique({
    where: { id },
  });

  if (!existingAlert) {
    return apiError("Alert not found.", 404);
  }

  if (existingAlert.source === "SYSTEM") {
    return apiError("System alerts can only be acknowledged or resolved.", 400);
  }

  const relationError = await validateAlertRelations(parsed.data.roomId, parsed.data.sensorId);

  if (relationError) {
    return apiError(relationError, relationError.includes("room") ? 404 : 400);
  }

  try {
    await prisma.alert.update({
      where: { id },
      data: parsed.data,
    });

    await syncRoomOperationalStatus(parsed.data.roomId);

    if (existingAlert.roomId !== parsed.data.roomId) {
      await syncRoomOperationalStatus(existingAlert.roomId);
    }

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: alertInclude,
    });

    if (!alert) {
      return apiError("Alert not found.", 404);
    }

    return ok(alert);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return apiError("Alert not found.", 404);
    }

    console.error("PUT /api/alerts/[id] error:", error);
    return apiError("Failed to update alert");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasPermission(user.role, "alert:delete")) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    const existingAlert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return apiError("Alert not found.", 404);
    }

    if (existingAlert.source === "SYSTEM") {
      return apiError("System alerts are preserved and can only be resolved.", 400);
    }

    await prisma.alert.delete({
      where: { id },
    });
    await syncRoomOperationalStatus(existingAlert.roomId);

    return noContent();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return apiError("Alert not found.", 404);
    }

    console.error("DELETE /api/alerts/[id] error:", error);
    return apiError("Failed to delete alert");
  }
}
