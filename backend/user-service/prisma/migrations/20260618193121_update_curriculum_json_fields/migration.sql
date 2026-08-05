/*
  Warnings:

  - You are about to drop the column `education` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Curriculum` table. All the data in the column will be lost.
  - The `courses` column on the `Curriculum` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Curriculum" DROP COLUMN "education",
DROP COLUMN "experience",
ADD COLUMN     "educations" JSONB,
ADD COLUMN     "experiences" JSONB,
ADD COLUMN     "skills" JSONB,
ALTER COLUMN "fileUrl" DROP NOT NULL,
DROP COLUMN "courses",
ADD COLUMN     "courses" JSONB;
