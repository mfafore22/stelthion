CREATE TYPE "CustomerServiceType" AS ENUM ('MALL', 'VENUE', 'MIXED');
CREATE TYPE "VenueStatus" AS ENUM ('LIVE', 'BETA', 'ALPHA', 'PLANNED');

ALTER TABLE "Customer"
ADD COLUMN "serviceType" "CustomerServiceType" NOT NULL DEFAULT 'MALL';

CREATE TABLE "Venue" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "address" TEXT,
  "capacity" INTEGER NOT NULL,
  "annualVisitors" INTEGER,
  "annualEvents" INTEGER,
  "status" "VenueStatus" NOT NULL DEFAULT 'LIVE',
  "customerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VenueZone" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "capacity" INTEGER,
  "sensorReady" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VenueEvent" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "expectedGuests" INTEGER,
  "eventSourceUrl" TEXT,
  "operationalNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VenueKpi" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "trend" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueKpi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Venue_venueId_key" ON "Venue"("venueId");
CREATE UNIQUE INDEX "VenueZone_venueId_zoneId_key" ON "VenueZone"("venueId", "zoneId");
CREATE INDEX "VenueEvent_venueId_startDate_idx" ON "VenueEvent"("venueId", "startDate");
CREATE UNIQUE INDEX "VenueKpi_venueId_code_key" ON "VenueKpi"("venueId", "code");

ALTER TABLE "Venue"
ADD CONSTRAINT "Venue_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VenueZone"
ADD CONSTRAINT "VenueZone_venueId_fkey"
FOREIGN KEY ("venueId") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VenueEvent"
ADD CONSTRAINT "VenueEvent_venueId_fkey"
FOREIGN KEY ("venueId") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VenueKpi"
ADD CONSTRAINT "VenueKpi_venueId_fkey"
FOREIGN KEY ("venueId") REFERENCES "Venue"("venueId") ON DELETE CASCADE ON UPDATE CASCADE;
