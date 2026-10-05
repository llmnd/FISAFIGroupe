CREATE TYPE "UserProfile" AS ENUM ('MARKET_CUSTOMER', 'TRAINING_PARTICIPANT');

ALTER TABLE "User"
ADD COLUMN "profiles" "UserProfile"[] NOT NULL DEFAULT ARRAY[]::"UserProfile"[];

UPDATE "User" AS u
SET "profiles" = array_append(u."profiles", 'MARKET_CUSTOMER'::"UserProfile")
WHERE EXISTS (
  SELECT 1
  FROM "MarketQuotation" AS quotation
  WHERE quotation."userId" = u."id"
);

UPDATE "User" AS u
SET "profiles" = array_append(u."profiles", 'TRAINING_PARTICIPANT'::"UserProfile")
WHERE EXISTS (
  SELECT 1
  FROM "InscriptionFormation" AS inscription
  WHERE lower(inscription."email") = lower(u."email")
);
