-- DropForeignKey
ALTER TABLE "Po" DROP CONSTRAINT "Po_taxTemplateId_fkey";

-- AlterTable
ALTER TABLE "Po" ADD COLUMN     "finYearId" INTEGER,
ADD COLUMN     "orderEntryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Po" ADD CONSTRAINT "Po_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Po" ADD CONSTRAINT "Po_orderEntryId_fkey" FOREIGN KEY ("orderEntryId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Po" ADD CONSTRAINT "Po_taxTemplateId_fkey" FOREIGN KEY ("taxTemplateId") REFERENCES "TaxTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
