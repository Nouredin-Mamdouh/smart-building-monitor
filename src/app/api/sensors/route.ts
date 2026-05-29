import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, created, forbidden, unauthorized, validationError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-users";
import { sensorCreateSchema } from "@/lib/validation";

export async function GET() {
    const user = await requireUser();

    if (!user) {
        return unauthorized();
    }

    try {
        const sensors = await prisma.sensor.findMany({
            include: {
                room: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(sensors);
    } catch (error) {
        console.error("GET /api/sensors error:", error);
        return NextResponse.json(
            { error: "Failed to fetch sensors" },
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

    const parsed = sensorCreateSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
        return validationError(parsed.error);
    }

    const room = await prisma.room.findUnique({
        where: {
            id: parsed.data.roomId,
        },
    });

    if (!room) {
        return apiError("Selected room does not exist.", 404);
    }

    try {
        const sensor = await prisma.sensor.create({
            data: parsed.data,
            include: {
                room: true,
            },
        });

        return created(sensor);
    } catch (error) {
        console.error("POST /api/sensors error:", error);
        return apiError("Failed to create sensor");
    }
}
