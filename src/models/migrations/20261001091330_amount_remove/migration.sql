/*
  Warnings:

  - You are about to drop the column `amount` on the `ProformaInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `quoteVersion` on the `SalesDelivery` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `SalesDeliveryItems` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProformaInvoiceItem" DROP COLUMN "amount";

-- AlterTable
ALTER TABLE "SalesDelivery" DROP COLUMN "quoteVersion";

-- AlterTable
ALTER TABLE "SalesDeliveryItems" DROP COLUMN "amount";
