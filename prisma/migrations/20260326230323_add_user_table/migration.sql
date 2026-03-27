-- CreateTable
CREATE TABLE "Inscription" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "author" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "objectives" TEXT,
    "price" DOUBLE PRECISION,
    "maxParticipants" INTEGER NOT NULL DEFAULT 20,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionFormation" (
    "id" SERIAL NOT NULL,
    "formationId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "available" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'ouverte',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionFormation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscriptionFormation" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "formationId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirme',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InscriptionFormation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brochure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PDF',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brochure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_email_key" ON "Inscription"("email");

-- CreateIndex
CREATE INDEX "Inscription_email_idx" ON "Inscription"("email");

-- CreateIndex
CREATE INDEX "Inscription_createdAt_idx" ON "Inscription"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_published_idx" ON "Article"("published");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Formation_slug_key" ON "Formation"("slug");

-- CreateIndex
CREATE INDEX "Formation_slug_idx" ON "Formation"("slug");

-- CreateIndex
CREATE INDEX "Formation_published_idx" ON "Formation"("published");

-- CreateIndex
CREATE INDEX "SessionFormation_formationId_idx" ON "SessionFormation"("formationId");

-- CreateIndex
CREATE INDEX "SessionFormation_startDate_idx" ON "SessionFormation"("startDate");

-- CreateIndex
CREATE INDEX "SessionFormation_status_idx" ON "SessionFormation"("status");

-- CreateIndex
CREATE INDEX "InscriptionFormation_sessionId_idx" ON "InscriptionFormation"("sessionId");

-- CreateIndex
CREATE INDEX "InscriptionFormation_formationId_idx" ON "InscriptionFormation"("formationId");

-- CreateIndex
CREATE INDEX "InscriptionFormation_email_idx" ON "InscriptionFormation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InscriptionFormation_sessionId_email_key" ON "InscriptionFormation"("sessionId", "email");

-- CreateIndex
CREATE INDEX "Brochure_published_idx" ON "Brochure"("published");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "SessionFormation" ADD CONSTRAINT "SessionFormation_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscriptionFormation" ADD CONSTRAINT "InscriptionFormation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SessionFormation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscriptionFormation" ADD CONSTRAINT "InscriptionFormation_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
