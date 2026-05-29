import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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