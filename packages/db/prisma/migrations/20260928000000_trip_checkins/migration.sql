-- Day-of-trip guide check-in workflow (5-phase flow described in
-- docs/PLANNING.md): per-seat, per-leg check-in records plus a phase field
-- on Trip that advances on its own once every seat is checked in.
CREATE TYPE "TripPhase" AS ENUM ('CHECKIN_DEPARTURE', 'EN_DESTINO', 'CHECKIN_RETURN', 'RETURN_TRANSFER');
CREATE TYPE "CheckInLeg" AS ENUM ('DEPARTURE', 'RETURN');

ALTER TABLE "Trip" ADD COLUMN "currentPhase" "TripPhase";

CREATE TABLE "TripCheckIn" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "seatAssignmentId" TEXT NOT NULL,
    "leg" "CheckInLeg" NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "checkedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TripCheckIn_seatAssignmentId_leg_key" ON "TripCheckIn"("seatAssignmentId", "leg");
CREATE INDEX "TripCheckIn_tripId_idx" ON "TripCheckIn"("tripId");

ALTER TABLE "TripCheckIn" ADD CONSTRAINT "TripCheckIn_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripCheckIn" ADD CONSTRAINT "TripCheckIn_seatAssignmentId_fkey" FOREIGN KEY ("seatAssignmentId") REFERENCES "SeatAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripCheckIn" ADD CONSTRAINT "TripCheckIn_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
