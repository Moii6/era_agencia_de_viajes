-- Room pricing moves from a flat per-night rate back to per-person pricing
-- (adult/minor), reflecting that in an all-inclusive the dominant cost is
-- food/drinks, which scales with headcount, not the bed. Existing rows are
-- backfilled so both new columns start equal to the old flat rate — nothing
-- about historical totals changes on its own; an OWNER/ADMIN adjusts the
-- minor price afterward if it should differ from the adult price.

ALTER TABLE "RoomType" ADD COLUMN "pricePerAdult" DECIMAL(12,2);
ALTER TABLE "RoomType" ADD COLUMN "pricePerMinor" DECIMAL(12,2);
UPDATE "RoomType" SET "pricePerAdult" = "pricePerNight", "pricePerMinor" = "pricePerNight";
ALTER TABLE "RoomType" ALTER COLUMN "pricePerAdult" SET NOT NULL;
ALTER TABLE "RoomType" ALTER COLUMN "pricePerMinor" SET NOT NULL;
ALTER TABLE "RoomType" DROP COLUMN "pricePerNight";

ALTER TABLE "QuoteOccupancy" ADD COLUMN "unitPricePerAdult" DECIMAL(12,2);
ALTER TABLE "QuoteOccupancy" ADD COLUMN "unitPricePerMinor" DECIMAL(12,2);
UPDATE "QuoteOccupancy" SET "unitPricePerAdult" = "unitPricePerNight", "unitPricePerMinor" = "unitPricePerNight";
ALTER TABLE "QuoteOccupancy" ALTER COLUMN "unitPricePerAdult" SET NOT NULL;
ALTER TABLE "QuoteOccupancy" ALTER COLUMN "unitPricePerMinor" SET NOT NULL;
ALTER TABLE "QuoteOccupancy" DROP COLUMN "unitPricePerNight";

-- Existing QuoteOccupancy.subtotal values are left untouched — they're a
-- historical record of what was actually charged under the old flat-rate
-- formula and must not be silently recomputed under the new one.
