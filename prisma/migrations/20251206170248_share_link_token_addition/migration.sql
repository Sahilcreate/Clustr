/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `ShareLink` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `ShareLink` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "token" TEXT NOT NULL,
ALTER COLUMN "fileId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");
