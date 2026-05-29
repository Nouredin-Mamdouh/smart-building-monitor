import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    await prisma.alert.deleteMany();
    await prisma.sensor.deleteMany();
    await prisma.room.deleteMany();

    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminName = process.env.SEED_ADMIN_NAME ?? "Internal Admin";

    if (adminEmail && adminPassword) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        await prisma.user.upsert({
            where: {
                email: adminEmail.toLowerCase(),
            },
            update: {
                name: adminName,
                passwordHash,
                role: "ADMIN",
            },
            create: {
                name: adminName,
                email: adminEmail.toLowerCase(),
                passwordHash,
                role: "ADMIN",
            },
        });
    } else {
        console.warn(
            "Skipped internal admin seed. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to seed a login account."
        );
    }

    const room101 = await prisma.room.create({
        data: {
            name: "Room 101",
            floor: 1,
            svgId: "room-101",
            temperature: 22.5,
            occupancyStatus: "OCCUPIED",
            energyConsumption: 12.4,
            status: "NORMAL",
        },
    });

    const room102 = await prisma.room.create({
        data: {
            name: "Room 102",
            floor: 1,
            svgId: "room-102",
            temperature: 28.7,
            occupancyStatus: "VACANT",
            energyConsumption: 18.9,
            status: "WARNING",
        },
    });

    const room103 = await prisma.room.create({
        data: {
            name: "Room 103",
            floor: 1,
            svgId: "room-103",
            temperature: 31.2,
            occupancyStatus: "OCCUPIED",
            energyConsumption: 26.5,
            status: "CRITICAL",
        },
    });

    const room201 = await prisma.room.create({
        data: {
            name: "Room 201",
            floor: 2,
            svgId: "room-201",
            temperature: 21.1,
            occupancyStatus: "VACANT",
            energyConsumption: 9.8,
            status: "NORMAL",
        },
    });

    const room202 = await prisma.room.create({
        data: {
            name: "Room 202",
            floor: 2,
            svgId: "room-202",
            temperature: 24.3,
            occupancyStatus: "OCCUPIED",
            energyConsumption: 14.7,
            status: "NORMAL",
        },
    });

    const sensors = await prisma.sensor.createMany({
        data: [
            {
                name: "Temp Sensor 101",
                type: "TEMPERATURE",
                value: 22.5,
                unit: "°C",
                status: "OK",
                roomId: room101.id,
            },
            {
                name: "Occupancy Sensor 101",
                type: "OCCUPANCY",
                value: 1,
                unit: "bool",
                status: "OK",
                roomId: room101.id,
            },
            {
                name: "Energy Sensor 101",
                type: "ENERGY",
                value: 12.4,
                unit: "kWh",
                status: "OK",
                roomId: room101.id,
            },
            {
                name: "Temp Sensor 102",
                type: "TEMPERATURE",
                value: 28.7,
                unit: "°C",
                status: "WARNING",
                roomId: room102.id,
            },
            {
                name: "Energy Sensor 102",
                type: "ENERGY",
                value: 18.9,
                unit: "kWh",
                status: "WARNING",
                roomId: room102.id,
            },
            {
                name: "Temp Sensor 103",
                type: "TEMPERATURE",
                value: 31.2,
                unit: "°C",
                status: "CRITICAL",
                roomId: room103.id,
            },
            {
                name: "Occupancy Sensor 103",
                type: "OCCUPANCY",
                value: 1,
                unit: "bool",
                status: "OK",
                roomId: room103.id,
            },
            {
                name: "Energy Sensor 103",
                type: "ENERGY",
                value: 26.5,
                unit: "kWh",
                status: "CRITICAL",
                roomId: room103.id,
            },
            {
                name: "Temp Sensor 201",
                type: "TEMPERATURE",
                value: 21.1,
                unit: "°C",
                status: "OK",
                roomId: room201.id,
            },
            {
                name: "Temp Sensor 202",
                type: "TEMPERATURE",
                value: 24.3,
                unit: "°C",
                status: "OK",
                roomId: room202.id,
            },
        ],
    });

    await prisma.alert.createMany({
        data: [
            {
                message: "Room 102 temperature is above normal range.",
                severity: "MEDIUM",
                status: "ACTIVE",
                roomId: room102.id,
            },
            {
                message: "Room 103 temperature is critical.",
                severity: "HIGH",
                status: "ACTIVE",
                roomId: room103.id,
            },
            {
                message: "Room 103 energy consumption is unusually high.",
                severity: "HIGH",
                status: "ACTIVE",
                roomId: room103.id,
            },
        ],
    });

    console.log("Seed completed successfully.");
    console.log({ sensorsCreated: sensors.count });
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
