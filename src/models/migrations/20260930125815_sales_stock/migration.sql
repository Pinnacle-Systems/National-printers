-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "profromaInvoiceId" INTEGER;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_profromaInvoiceId_fkey" FOREIGN KEY ("profromaInvoiceId") REFERENCES "ProformaInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
