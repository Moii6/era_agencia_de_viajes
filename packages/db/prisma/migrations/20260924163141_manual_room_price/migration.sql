-- Room booking happens on the hotel's own site (price varies by date/promo,
-- outside this app's control), not through a price catalog here — so
-- RoomType no longer carries a price at all, and QuoteOccupancy.subtotal
-- becomes a value typed in directly by whoever builds the quote (the total
-- the hotel quoted for the whole stay) instead of something computed from
-- adults/minors. Those two columns stay on QuoteOccupancy purely as
-- reference info (what to search for on the hotel's site).
--
-- Existing QuoteOccupancy.subtotal values are left as-is — they're a
-- historical record of what was actually charged, unaffected by how the
-- figure used to be computed.

ALTER TABLE "RoomType" DROP COLUMN "pricePerAdult";
ALTER TABLE "RoomType" DROP COLUMN "pricePerMinor";
ALTER TABLE "RoomType" DROP COLUMN "currency";

ALTER TABLE "QuoteOccupancy" DROP COLUMN "unitPricePerAdult";
ALTER TABLE "QuoteOccupancy" DROP COLUMN "unitPricePerMinor";
