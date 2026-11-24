/*
  Warnings:

  - You are about to drop the column `gsmId` on the `OrderItems` table. All the data in the column will be lost.
  - You are about to drop the column `sizeTemplateId` on the `OrderItems` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderItems" DROP CONSTRAINT "OrderItems_gsmId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItems" DROP CONSTRAINT "OrderItems_sizeTemplateId_fkey";

-- AlterTable
ALTER TABLE "OrderItems" DROP COLUMN "gsmId",
DROP COLUMN "sizeTemplateId";

-- AlterTable
ALTER TABLE "OrderStyleItems" ADD COLUMN     "description" TEXT;
