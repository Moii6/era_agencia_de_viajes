-- Replace the single free-text contactInfo column with a contacts array,
-- preserving any existing value as the first (and only) element.
ALTER TABLE "Provider" ADD COLUMN "contacts" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "Provider"
SET "contacts" = ARRAY["contactInfo"]
WHERE "contactInfo" IS NOT NULL AND "contactInfo" <> '';

ALTER TABLE "Provider" DROP COLUMN "contactInfo";
