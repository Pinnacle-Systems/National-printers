-- AlterTable
ALTER TABLE "OrderItems" ADD COLUMN     "barcodeFrom" TEXT,
ADD COLUMN     "barcodeTo" TEXT,
ADD COLUMN     "itemGroupId" INTEGER,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "sizeTemplateId" INTEGER,
ADD COLUMN     "trackingType" TEXT;

-- CreateTable
CREATE TABLE "OrderSizeBreakup" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "sizeId" INTEGER,
    "qty" INTEGER,
    "barcodeFrom" TEXT,
    "barcodeTo" TEXT,

    CONSTRAINT "OrderSizeBreakup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_sizeTemplateId_fkey" FOREIGN KEY ("sizeTemplateId") REFERENCES "SizeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSizeBreakup" ADD CONSTRAINT "OrderSizeBreakup_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSizeBreakup" ADD CONSTRAINT "OrderSizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;
