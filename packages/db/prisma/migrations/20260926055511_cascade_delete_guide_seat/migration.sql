-- Removing a TripGuide used to just SET NULL on any SeatAssignment
-- referencing it, leaving a dangling seat row pointing at nobody (both
-- travelerId and tripGuideId null). Now the seat assignment is deleted
-- outright along with the guide — added while building guide management
-- (which didn't exist as an API before this migration).

ALTER TABLE "SeatAssignment" DROP CONSTRAINT "SeatAssignment_tripGuideId_fkey";
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_tripGuideId_fkey"
  FOREIGN KEY ("tripGuideId") REFERENCES "TripGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
