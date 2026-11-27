/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Style` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `Style` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Size" ADD COLUMN     "hidePrintFormat" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "hidePrintFormat" BOOLEAN DEFAULT false,
ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Style_name_key" ON "Style"("name");
