-- Two-owner approval workflow for creating/editing agency users.
ALTER TYPE "UserStatus" ADD VALUE 'PENDING';

ALTER TABLE "User" ADD COLUMN "requestedByUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "pendingName" TEXT;
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "pendingRole" "UserRole";

ALTER TABLE "User" ADD CONSTRAINT "User_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
