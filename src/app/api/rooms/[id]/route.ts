import { prisma } from "@/lib/prisma";
import { apiError, forbidden, noContent, ok, unauthorized, validationError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-users";
import { hasPermission } from "@/lib/rbac";
import { roomUpdateSchema } from "@/lib/validation";
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
  const room = await prisma.room.findUnique({
    where: { id },
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
    return apiError("Room not found.", 404);
  }

  return ok(room);
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasPermission(user.role, "room:update")) {
    return forbidden();
  }

  const { id } = await context.params;
  const parsed = roomUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const room = await prisma.room.update({
      where: { id },
      data: parsed.data,
      include: {
        sensors: true,
        alerts: {
          where: {
            status: "ACTIVE",
          },
        },
      },
    });

    return ok(room);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return apiError("Room not found.", 404);
      }

      if (error.code === "P2002") {
        return apiError("A room with this SVG id already exists.", 409);
      }
    }

    console.error("PUT /api/rooms/[id] error:", error);
    return apiError("Failed to update room");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasPermission(user.role, "room:delete")) {
    return forbidden();
  }

  const { id } = await context.params;

  try {
    await prisma.room.delete({
      where: { id },
    });

    return noContent();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return apiError("Room not found.", 404);
    }

    console.error("DELETE /api/rooms/[id] error:", error);
    return apiError("Failed to delete room");
  }
}
