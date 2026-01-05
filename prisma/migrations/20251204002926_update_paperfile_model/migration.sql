/*
  Warnings:

  - You are about to drop the column `type` on the `PaperFile` table. All the data in the column will be lost.
  - Added the required column `fileKey` to the `PaperFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `PaperFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `PaperFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaperFile" DROP COLUMN "type",
ADD COLUMN     "fileKey" TEXT NOT NULL,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL;
