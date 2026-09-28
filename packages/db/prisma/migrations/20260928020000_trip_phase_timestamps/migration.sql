-- Per-phase timestamps, purely so the dashboard tracker can show a real
-- date per step instead of just the current one — not used for gating.
ALTER TABLE "Trip" ADD COLUMN "phaseCheckinDepartureAt" TIMESTAMP(3);
ALTER TABLE "Trip" ADD COLUMN "phaseEnDestinoAt" TIMESTAMP(3);
ALTER TABLE "Trip" ADD COLUMN "phaseCheckinReturnAt" TIMESTAMP(3);
ALTER TABLE "Trip" ADD COLUMN "phaseReturnTransferAt" TIMESTAMP(3);
ALTER TABLE "Trip" ADD COLUMN "completedAt" TIMESTAMP(3);
