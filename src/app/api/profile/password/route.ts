import bcrypt from "bcryptjs";
import { apiError, ok, unauthorized, validationError } from "@/lib/api-response";
import { accountUserSelect, toAccountUser } from "@/lib/account-users";
import { requireUser } from "@/lib/auth-users";
import { prisma } from "@/lib/prisma";
import { profilePasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  const parsed = profilePasswordSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!profile?.isActive) {
    return unauthorized();
  }

  const currentPasswordMatches = await bcrypt.compare(parsed.data.currentPassword, profile.passwordHash);

  if (!currentPasswordMatches) {
    return apiError("Current password is incorrect.", 400);
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const updatedProfile = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
    select: accountUserSelect,
  });

  return ok(toAccountUser(updatedProfile));
}
