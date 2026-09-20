-- Every quote now carries the agency's commission as its own line item
-- (5% of subtotal + activities), rather than folding it invisibly into
-- total. Existing quotes get commission = 0 here; a follow-up script
-- recomputes commission/total for them under the new formula so historical
-- data stays internally consistent (same approach as the room-pricing
-- migration).
ALTER TABLE "Quote" ADD COLUMN "commission" DECIMAL(12,2) NOT NULL DEFAULT 0;
