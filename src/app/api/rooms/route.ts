import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, created, forbidden, unauthorized, validationError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-users";
import { roomCreateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

export async function GET() {
    const user = await requireUser();

    if (!user) {
        return unauthorized();
    }

    try {
        const rooms = await prisma.room.findMany({
            include: {
                sensors: true,
                alerts: {
                    where: {
                        status: "ACTIVE",
                    },
                },
            },
            orderBy: [
                { floor: "asc" },
                { name: "asc" },
            ],
        });

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("GET /api/rooms error:", error);
        return NextResponse.json(
            { error: "Failed to fetch rooms" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const user = await requireUser();

    if (!user) {
        return unauthorized();
    }

    if (user.role !== "ADMIN") {
        return forbidden();
    }

    const parsed = roomCreateSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
        return validationError(parsed.error);
    }

    try {
        const room = await prisma.room.create({
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

        return created(room);
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return apiError("A room with this SVG id already exists.", 409);
        }

        console.error("POST /api/rooms error:", error);
        return apiError("Failed to create room");
    }
}
