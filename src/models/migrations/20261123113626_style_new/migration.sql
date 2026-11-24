/*
  Warnings:

  - You are about to drop the column `aliasName` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `gsmId` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `itemGroupId` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `sizeTemplateId` on the `Style` table. All the data in the column will be lost.
  - You are about to drop the column `uomId` on the `Style` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Style" DROP CONSTRAINT "Style_gsmId_fkey";

-- DropForeignKey
ALTER TABLE "Style" DROP CONSTRAINT "Style_itemGroupId_fkey";

-- DropForeignKey
ALTER TABLE "Style" DROP CONSTRAINT "Style_sizeTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Style" DROP CONSTRAINT "Style_uomId_fkey";

-- AlterTable
ALTER TABLE "Style" DROP COLUMN "aliasName",
DROP COLUMN "code",
DROP COLUMN "gsmId",
DROP COLUMN "itemGroupId",
DROP COLUMN "sizeTemplateId",
DROP COLUMN "uomId",
ADD COLUMN     "styleItemId" INTEGER;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
