-- AlterTable
ALTER TABLE "OrderItems" ADD COLUMN     "hsnId" INTEGER;

-- AlterTable
ALTER TABLE "ProformaInvoiceItem" ADD COLUMN     "hsnId" INTEGER;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
