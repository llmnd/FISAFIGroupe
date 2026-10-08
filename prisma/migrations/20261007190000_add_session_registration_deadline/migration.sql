ALTER TABLE "SessionFormation"
ADD COLUMN "registrationDeadline" TIMESTAMP(3);

UPDATE "SessionFormation"
SET "registrationDeadline" = "startDate";

ALTER TABLE "SessionFormation"
ALTER COLUMN "registrationDeadline" SET NOT NULL;
