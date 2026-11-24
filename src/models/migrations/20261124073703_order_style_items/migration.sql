/*
  Warnings:

  - You are about to drop the column `trackingType` on the `OrderItems` table. All the data in the column will be lost.
  - You are about to drop the column `orderItemId` on the `OrderSizeBreakup` table. All the data in the column will be lost.
  - Added the required column `orderStyleItemsId` to the `OrderSizeBreakup` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderSizeBreakup" DROP CONSTRAINT "OrderSizeBreakup_orderItemId_fkey";

-- AlterTable
ALTER TABLE "OrderItems" DROP COLUMN "trackingType";

-- AlterTable
ALTER TABLE "OrderSizeBreakup" DROP COLUMN "orderItemId",
ADD COLUMN     "orderStyleItemsId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "OrderStyleItems" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "styleId" INTEGER,
    "trackingType" TEXT,

    CONSTRAINT "OrderStyleItems_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderStyleItems" ADD CONSTRAINT "OrderStyleItems_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStyleItems" ADD CONSTRAINT "OrderStyleItems_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSizeBreakup" ADD CONSTRAINT "OrderSizeBreakup_orderStyleItemsId_fkey" FOREIGN KEY ("orderStyleItemsId") REFERENCES "OrderStyleItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
