-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('OCCUPIED', 'VACANT');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('TEMPERATURE', 'OCCUPANCY', 'ENERGY');

-- CreateEnum
CREATE TYPE "SensorStatus" AS ENUM ('OK', 'WARNING', 'CRITICAL', 'OFFLINE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'RESOLVED');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "svgId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "occupancyStatus" "OccupancyStatus" NOT NULL,
    "energyConsumption" DOUBLE PRECISION NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SensorType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "SensorStatus" NOT NULL DEFAULT 'OK',
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "roomId" TEXT NOT NULL,
    "sensorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_svgId_key" ON "Room"("svgId");

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
