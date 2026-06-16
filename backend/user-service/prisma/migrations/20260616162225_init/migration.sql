-- CreateEnum
CREATE TYPE "CurriculumType" AS ENUM ('UPLOAD', 'PLATFORM');

-- CreateTable
CREATE TABLE "UserProfile" (
    "authUserId" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "pixKey" VARCHAR(100) NOT NULL,
    "photoUrl" TEXT,
    "bio" VARCHAR(500),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("authUserId")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "userId" TEXT NOT NULL,
    "type" "CurriculumType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "professionalSummary" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "courses" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_phone_key" ON "UserProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_pixKey_key" ON "UserProfile"("pixKey");

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("authUserId") ON DELETE CASCADE ON UPDATE CASCADE;
