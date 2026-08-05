/*
  Warnings:

  - You are about to drop the column `pixKey` on the `UserProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserProfile_pixKey_key";

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "pixKey";
