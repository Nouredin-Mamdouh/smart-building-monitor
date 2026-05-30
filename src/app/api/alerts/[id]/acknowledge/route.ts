import { prisma } from "@/lib/prisma";
import { apiError, forbidden, ok, unauthorized } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-users";
import { hasPermission } from "@/lib/rbac";

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

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasPermission(user.role, "alert:update")) {
    return forbidden();
  }

  const { id } = await context.params;
  const existingAlert = await prisma.alert.findUnique({
    where: { id },
  });

  if (!existingAlert) {
    return apiError("Alert not found.", 404);
  }

  if (existingAlert.status !== "ACTIVE") {
    return apiError("Only active alerts can be acknowledged.", 400);
  }

  const alert = await prisma.alert.update({
    where: { id },
    data: {
      acknowledgedAt: existingAlert.acknowledgedAt ?? new Date(),
      acknowledgedById: existingAlert.acknowledgedById ?? user.id,
    },
    include: alertInclude,
  });

  return ok(alert);
}
