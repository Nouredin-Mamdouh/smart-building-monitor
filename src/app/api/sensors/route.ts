import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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