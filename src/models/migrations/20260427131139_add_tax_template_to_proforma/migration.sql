-- AlterTable
ALTER TABLE "ProformaInvoice" ADD COLUMN     "taxTemplateId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_taxTemplateId_fkey" FOREIGN KEY ("taxTemplateId") REFERENCES "TaxTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
