-- CreateEnum
CREATE TYPE "AlertRule" AS ENUM ('ROOM_TEMPERATURE', 'ROOM_ENERGY', 'SENSOR_TEMPERATURE', 'SENSOR_ENERGY', 'SENSOR_STATUS');

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN "systemKey" TEXT,
ADD COLUMN "systemRule" "AlertRule";

-- CreateIndex
CREATE INDEX "Alert_source_status_systemKey_idx" ON "Alert"("source", "status", "systemKey");

-- Prevent duplicate active SYSTEM alerts for the same managed condition while
-- preserving resolved alert history for repeated future incidents.
CREATE UNIQUE INDEX "Alert_active_systemKey_unique" ON "Alert"("systemKey")
WHERE "source" = 'SYSTEM' AND "status" = 'ACTIVE' AND "systemKey" IS NOT NULL;
