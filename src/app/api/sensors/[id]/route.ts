import { prisma } from "@/lib/prisma";
import { apiError, forbidden, noContent, ok, unauthorized, validationError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-users";
import { hasPermission } from "@/lib/rbac";
import { sensorUpdateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await context.params;
  const sensor = await prisma.sensor.findUnique({
    where: { id },
    include: {
      room: true,
    },
  });

  if (!sensor) {
    return apiError("Sensor not found.", 404);
  }

  return ok(sensor);
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasPermission(user.role, "sensor:update")) {
    return forbidden();
  }

  const { id } = await context.params;
  const parsed = sensorUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const room = await prisma.room.findUnique({
    where: {
      id: parsed.data.roomId,
    },
  });

  if (!room) {
    return apiError("Selected room does not exist.", 404);
  }

  try {
    const sensor = await prisma.sensor.update({
      where: { id },
      data: parsed.data,
      include: {
        room: true,
      },
    });

    return ok(sensor);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return apiError("Sensor not found.", 404);
    }

    console.error("PUT /api/sensors/[id] error:", error);
    return apiError("Failed to update sensor");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasPermission(user.role, "sensor:delete")) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    await prisma.sensor.delete({
      where: { id },
    });

    return noContent();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return apiError("Sensor not found.", 404);
    }

    console.error("DELETE /api/sensors/[id] error:", error);
    return apiError("Failed to delete sensor");
  }
}
