/*
  Warnings:

  - The primary key for the `Curriculum` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `personId` to the `Curriculum` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Curriculum" DROP CONSTRAINT "Curriculum_userId_fkey";

-- AlterTable
ALTER TABLE "Curriculum" DROP CONSTRAINT "Curriculum_pkey",
DROP COLUMN "userId",
ADD COLUMN     "personId" TEXT NOT NULL,
ADD CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("personId");

-- DropTable
DROP TABLE "UserProfile";

-- CreateTable
CREATE TABLE "PersonProfile" (
    "authUserId" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "photoKey" TEXT,
    "bio" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonProfile_pkey" PRIMARY KEY ("authUserId")
);

-- CreateTable
CREATE TABLE "PersonAddress" (
    "personId" TEXT NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "zipCode" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonAddress_pkey" PRIMARY KEY ("personId")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "authUserId" TEXT NOT NULL,
    "companyName" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "logoKey" TEXT,
    "bio" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("authUserId")
);

-- CreateTable
CREATE TABLE "CompanyAddress" (
    "companyId" TEXT NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "zipCode" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyAddress_pkey" PRIMARY KEY ("companyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonProfile_phone_key" ON "PersonProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_phone_key" ON "CompanyProfile"("phone");

-- AddForeignKey
ALTER TABLE "PersonAddress" ADD CONSTRAINT "PersonAddress_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonProfile"("authUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_personId_fkey" FOREIGN KEY ("personId") REFERENCES "PersonProfile"("authUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAddress" ADD CONSTRAINT "CompanyAddress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("authUserId") ON DELETE CASCADE ON UPDATE CASCADE;
