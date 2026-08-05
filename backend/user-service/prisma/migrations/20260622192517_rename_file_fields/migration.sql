/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Curriculum" DROP COLUMN "fileUrl",
ADD COLUMN     "fileKey" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "photoUrl",
ADD COLUMN     "photoKey" TEXT;
