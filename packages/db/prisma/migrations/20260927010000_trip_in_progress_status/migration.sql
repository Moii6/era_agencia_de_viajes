-- Set automatically once a trip's departure date+time is reached — never
-- chosen manually, same pattern as Quote's EXPIRED.
ALTER TYPE "TripStatus" ADD VALUE 'IN_PROGRESS';
