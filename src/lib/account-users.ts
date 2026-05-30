import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/rbac";

export const accountUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  deactivatedAt: true,
  passwordUpdatedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type AccountUserRecord = Prisma.UserGetPayload<{ select: typeof accountUserSelect }>;

export function toAccountUser(user: AccountUserRecord) {
  return {
    ...user,
    role: user.role as AppRole,
  };
}

export async function validateUserStateChange({
  actorId,
  target,
  nextRole,
  nextIsActive,
  isDelete = false,
}: {
  actorId: string;
  target: { id: string; role: AppRole; isActive: boolean };
  nextRole: AppRole;
  nextIsActive: boolean;
  isDelete?: boolean;
}) {
  if (actorId === target.id && isDelete) {
    return "You cannot delete your own account.";
  }

  if (actorId === target.id && !nextIsActive) {
    return "You cannot deactivate your own account.";
  }

  if (actorId === target.id && target.role === "ADMIN" && nextRole !== "ADMIN") {
    return "You cannot remove your own admin role.";
  }

  const removesActiveAdmin =
    target.role === "ADMIN" &&
    target.isActive &&
    (isDelete || nextRole !== "ADMIN" || !nextIsActive);

  if (!removesActiveAdmin) {
    return null;
  }

  const remainingAdmins = await prisma.user.count({
    where: {
      id: {
        not: target.id,
      },
      role: "ADMIN",
      isActive: true,
    },
  });

  return remainingAdmins === 0 ? "At least one active admin account is required." : null;
}
