/*
  Warnings:

  - You are about to drop the column `barcodeFrom` on the `OrderItems` table. All the data in the column will be lost.
  - You are about to drop the column `barcodeTo` on the `OrderItems` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `OrderItems` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderItems" DROP CONSTRAINT "OrderItems_sizeId_fkey";

-- AlterTable
ALTER TABLE "OrderItems" DROP COLUMN "barcodeFrom",
DROP COLUMN "barcodeTo",
DROP COLUMN "sizeId",
ADD COLUMN     "itemOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProformaInvoiceItem" ADD COLUMN     "itemOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sizeTemplateId" INTEGER,
ADD COLUMN     "trackingType" TEXT;

-- CreateTable
CREATE TABLE "ProformaSizeBreakup" (
    "id" SERIAL NOT NULL,
    "piItemId" INTEGER NOT NULL,
    "sizeId" INTEGER,
    "qty" DOUBLE PRECISION,
    "barcodeFrom" TEXT,
    "barcodeTo" TEXT,

    CONSTRAINT "ProformaSizeBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_sizeTemplateId_fkey" FOREIGN KEY ("sizeTemplateId") REFERENCES "SizeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaSizeBreakup" ADD CONSTRAINT "ProformaSizeBreakup_piItemId_fkey" FOREIGN KEY ("piItemId") REFERENCES "ProformaInvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaSizeBreakup" ADD CONSTRAINT "ProformaSizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;
