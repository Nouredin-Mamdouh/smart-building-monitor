import { Prisma } from "@prisma/client";
import { apiError, forbidden, noContent, ok, unauthorized, validationError } from "@/lib/api-response";
import { accountUserSelect, toAccountUser, validateUserStateChange } from "@/lib/account-users";
import { requireUser } from "@/lib/auth-users";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/rbac";
import { userUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (user.role !== "ADMIN") {
    return forbidden();
  }

  const { id } = await context.params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: accountUserSelect,
  });

  if (!target) {
    return apiError("User not found.", 404);
  }

  return ok(toAccountUser(target));
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (user.role !== "ADMIN") {
    return forbidden();
  }

  const { id } = await context.params;
  const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!target) {
    return apiError("User not found.", 404);
  }

  const stateError = await validateUserStateChange({
    actorId: user.id,
    target: {
      id: target.id,
      role: target.role as AppRole,
      isActive: target.isActive,
    },
    nextRole: parsed.data.role,
    nextIsActive: parsed.data.isActive,
  });

  if (stateError) {
    return apiError(stateError, 400);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        deactivatedAt: parsed.data.isActive ? null : new Date(),
        deactivatedById: parsed.data.isActive ? null : user.id,
      },
      select: accountUserSelect,
    });

    return ok(toAccountUser(updatedUser));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("A user with this email already exists.", 409);
    }

    console.error("PATCH /api/users/[id] error:", error);
    return apiError("Failed to update user.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (user.role !== "ADMIN") {
    return forbidden();
  }

  const { id } = await context.params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!target) {
    return apiError("User not found.", 404);
  }

  const stateError = await validateUserStateChange({
    actorId: user.id,
    target: {
      id: target.id,
      role: target.role as AppRole,
      isActive: target.isActive,
    },
    nextRole: target.role as AppRole,
    nextIsActive: false,
    isDelete: true,
  });

  if (stateError) {
    return apiError(stateError, 400);
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    return noContent();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return apiError("User not found.", 404);
    }

    console.error("DELETE /api/users/[id] error:", error);
    return apiError("Failed to delete user.");
  }
}
