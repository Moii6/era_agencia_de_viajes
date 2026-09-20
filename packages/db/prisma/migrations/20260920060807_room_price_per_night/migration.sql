-- Room pricing no longer splits by adult/minor — a room now has a single
-- nightly rate, charged the same regardless of who occupies it, multiplied
-- by the trip's number of nights to get the total lodging cost.
--
-- Existing pricePerAdult / unitPriceAdult values are carried over as a
-- starting point for the new nightly rate (there's no way to reconstruct
-- what the old flat price was actually meant to cover). QuoteOccupancy.subtotal
-- and the parent Quote's subtotal/total are recomputed against the new
-- per-night formula in a follow-up data-fix script, not in this migration.

ALTER TABLE "RoomType" ADD COLUMN "pricePerNight" DECIMAL(12,2);
UPDATE "RoomType" SET "pricePerNight" = "pricePerAdult";
ALTER TABLE "RoomType" ALTER COLUMN "pricePerNight" SET NOT NULL;
ALTER TABLE "RoomType" DROP COLUMN "pricePerAdult";
ALTER TABLE "RoomType" DROP COLUMN "pricePerMinor";

ALTER TABLE "QuoteOccupancy" ADD COLUMN "unitPricePerNight" DECIMAL(12,2);
UPDATE "QuoteOccupancy" SET "unitPricePerNight" = "unitPriceAdult";
ALTER TABLE "QuoteOccupancy" ALTER COLUMN "unitPricePerNight" SET NOT NULL;
ALTER TABLE "QuoteOccupancy" DROP COLUMN "unitPriceAdult";
ALTER TABLE "QuoteOccupancy" DROP COLUMN "unitPriceMinor";
