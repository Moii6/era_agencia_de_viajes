-- Agency profile details, useful for whoever administers the ERP and onboards
-- a new travel agency: who to call, where they're based, how to reach them.
ALTER TABLE "Tenant" ADD COLUMN "representativeName" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "address" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "contacts" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Tenant" ADD COLUMN "notes" TEXT;
