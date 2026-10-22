CREATE TABLE "ProjectBrief" (
  "id" TEXT NOT NULL,
  "budget" DOUBLE PRECISION,
  "targetDate" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "priorities" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "modules" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "updatedById" TEXT,
  "updatedByEmail" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectBrief_pkey" PRIMARY KEY ("id")
);
