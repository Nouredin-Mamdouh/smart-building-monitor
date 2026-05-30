import { apiError, ok, unauthorized, validationError } from "@/lib/api-response";
import { accountUserSelect, toAccountUser } from "@/lib/account-users";
import { requireUser } from "@/lib/auth-users";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validation";

export async function GET() {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: accountUserSelect,
  });

  if (!profile?.isActive) {
    return unauthorized();
  }

  return ok(toAccountUser(profile));
}

export async function PATCH(request: Request) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const profile = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: parsed.data.name,
      },
      select: accountUserSelect,
    });

    return ok(toAccountUser(profile));
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return apiError("Failed to update profile.");
  }
}
