-- Manual cancellation, separate from the automatic EXPIRED (which fires
-- once validUntil passes, never chosen by an agent).
ALTER TYPE "QuoteStatus" ADD VALUE 'CANCELLED';
