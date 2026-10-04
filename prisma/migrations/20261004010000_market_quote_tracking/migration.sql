ALTER TABLE "User"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationTokenHash" TEXT,
ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "odooPartnerId" INTEGER;

CREATE UNIQUE INDEX "User_emailVerificationTokenHash_key"
ON "User"("emailVerificationTokenHash");

CREATE UNIQUE INDEX "User_odooPartnerId_key"
ON "User"("odooPartnerId");

CREATE TABLE "MarketQuotation" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "odooOrderId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "amountTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketQuotation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketQuotation_odooOrderId_key"
ON "MarketQuotation"("odooOrderId");

CREATE INDEX "MarketQuotation_userId_createdAt_idx"
ON "MarketQuotation"("userId", "createdAt");

ALTER TABLE "MarketQuotation"
ADD CONSTRAINT "MarketQuotation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
