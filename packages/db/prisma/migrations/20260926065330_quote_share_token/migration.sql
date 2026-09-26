-- Lets a client open a read-only public view of a quote without an account,
-- once the agency marks it as SENT.
ALTER TABLE "Quote" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "Quote_shareToken_key" ON "Quote"("shareToken");
