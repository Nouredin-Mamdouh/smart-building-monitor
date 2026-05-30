import { auth } from "../../auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, type AppRole, type Permission } from "@/lib/rbac";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    return null;
  }

  return {
    ...user,
    role: user.role as AppRole,
  };
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!user || !hasPermission(user.role, permission)) {
    return null;
  }

  return user;
}
