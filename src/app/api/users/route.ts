import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { apiError, created, forbidden, ok, unauthorized, validationError } from "@/lib/api-response";
import { accountUserSelect, toAccountUser } from "@/lib/account-users";
import { requireUser } from "@/lib/auth-users";
import { userCreateSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (user.role !== "ADMIN") {
    return forbidden();
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: accountUserSelect,
  });

  return ok(users.map(toAccountUser));
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return unauthorized();
  }

  if (user.role !== "ADMIN") {
    return forbidden();
  }

  const parsed = userCreateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { password, ...input } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const createdUser = await prisma.user.create({
      data: {
        ...input,
        passwordHash,
        isActive: true,
        deactivatedAt: null,
        deactivatedById: null,
        passwordUpdatedAt: new Date(),
      },
      select: accountUserSelect,
    });

    return created(toAccountUser(createdUser));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("A user with this email already exists.", 409);
    }

    console.error("POST /api/users error:", error);
    return apiError("Failed to create user.");
  }
}
