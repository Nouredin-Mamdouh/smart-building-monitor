import bcrypt from "bcryptjs";
import { apiError, forbidden, ok, unauthorized, validationError } from "@/lib/api-response";
import { accountUserSelect, toAccountUser } from "@/lib/account-users";
import { requireUser } from "@/lib/auth-users";
import { prisma } from "@/lib/prisma";
import { userPasswordResetSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (user.role !== "ADMIN") {
    return forbidden();
  }

  const { id } = await context.params;

  if (id === user.id) {
    return apiError("Use profile settings to change your own password.", 400);
  }

  const parsed = userPasswordResetSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
    },
  });

  if (!target) {
    return apiError("User not found.", 404);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
    select: accountUserSelect,
  });

  return ok(toAccountUser(updatedUser));
}
