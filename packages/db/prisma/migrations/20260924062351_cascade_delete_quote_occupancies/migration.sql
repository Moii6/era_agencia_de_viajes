-- Deleting a DRAFT quote (the only status QuotesService.remove allows)
-- always failed once it had occupancies, since QuoteOccupancy -> Quote was
-- ON DELETE RESTRICT: Postgres refused the delete instead of cascading. A
-- DRAFT quote can never have a Reservation (those require ACCEPTED), so
-- deleting it always means discarding its occupancies (and their
-- activities) too — cascading is safe, not just convenient.

ALTER TABLE "QuoteOccupancy" DROP CONSTRAINT "QuoteOccupancy_quoteId_fkey";
ALTER TABLE "QuoteOccupancy" ADD CONSTRAINT "QuoteOccupancy_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuoteOccupancyActivity" DROP CONSTRAINT "QuoteOccupancyActivity_quoteOccupancyId_fkey";
ALTER TABLE "QuoteOccupancyActivity" ADD CONSTRAINT "QuoteOccupancyActivity_quoteOccupancyId_fkey"
  FOREIGN KEY ("quoteOccupancyId") REFERENCES "QuoteOccupancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
