import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, created, forbidden, unauthorized, validationError } from "@/lib/api-response";
import { requireUser } from "@/lib/auth-users";
import { hasPermission } from "@/lib/rbac";
import { alertCreateSchema } from "@/lib/validation";

export async function GET() {
    const user = await requireUser();

    if (!user) {
        return unauthorized();
    }

    try {
        const alerts = await prisma.alert.findMany({
            include: {
                room: true,
                sensor: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(alerts);
    } catch (error) {
        console.error("GET /api/alerts error:", error);
        return NextResponse.json(
            { error: "Failed to fetch alerts" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const user = await requireUser();

    if (!user) {
        return unauthorized();
    }

    if (!hasPermission(user.role, "alert:create")) {
        return forbidden();
    }

    const parsed = alertCreateSchema.safeParse(await request.json().catch(() => null));

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

    if (parsed.data.sensorId) {
        const sensor = await prisma.sensor.findUnique({
            where: {
                id: parsed.data.sensorId,
            },
        });

        if (!sensor || sensor.roomId !== parsed.data.roomId) {
            return apiError("Selected sensor must belong to the selected room.", 400);
        }
    }

    try {
        const alert = await prisma.alert.create({
            data: parsed.data,
            include: {
                room: true,
                sensor: true,
            },
        });

        return created(alert);
    } catch (error) {
        console.error("POST /api/alerts error:", error);
        return apiError("Failed to create alert");
    }
}
