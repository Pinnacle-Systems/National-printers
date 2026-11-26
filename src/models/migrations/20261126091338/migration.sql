/*
  Warnings:

  - A unique constraint covering the columns `[name,styleItemId]` on the table `Style` will be added. If there are existing duplicate values, this will fail.
  - Made the column `styleItemId` on table `Style` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Style" DROP CONSTRAINT "Style_styleItemId_fkey";

-- DropIndex
DROP INDEX "Style_name_key";

-- AlterTable
ALTER TABLE "Style" ALTER COLUMN "styleItemId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Style_name_styleItemId_key" ON "Style"("name", "styleItemId");

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
