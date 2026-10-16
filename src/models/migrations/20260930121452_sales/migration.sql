-- AlterTable
ALTER TABLE "SalesDelivery" ADD COLUMN     "orderEntryId" INTEGER,
ADD COLUMN     "profromaInvoiceId" INTEGER;

-- AddForeignKey
ALTER TABLE "SalesDelivery" ADD CONSTRAINT "SalesDelivery_profromaInvoiceId_fkey" FOREIGN KEY ("profromaInvoiceId") REFERENCES "ProformaInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDelivery" ADD CONSTRAINT "SalesDelivery_orderEntryId_fkey" FOREIGN KEY ("orderEntryId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
