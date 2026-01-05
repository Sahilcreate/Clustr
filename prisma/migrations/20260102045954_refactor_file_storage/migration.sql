/*
  Warnings:

  - You are about to drop the column `path` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `storedName` on the `File` table. All the data in the column will be lost.
  - Added the required column `bucket` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectKey` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "path",
DROP COLUMN "storedName",
ADD COLUMN     "bucket" TEXT NOT NULL,
ADD COLUMN     "objectKey" TEXT NOT NULL;
