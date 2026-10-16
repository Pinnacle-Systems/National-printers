-- AlterTable
ALTER TABLE "ProformaInvoiceItem" ADD COLUMN     "itemGroupId" INTEGER;

-- AlterTable
ALTER TABLE "SalesDeliveryItems" ADD COLUMN     "itemGroupId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryItems" ADD CONSTRAINT "SalesDeliveryItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
