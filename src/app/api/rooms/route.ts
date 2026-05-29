import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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