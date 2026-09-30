-- AlterTable
ALTER TABLE "SalesDeliveryBreakup" ADD COLUMN     "proformaSizeBreakupId" INTEGER;

-- AddForeignKey
ALTER TABLE "SalesDeliveryBreakup" ADD CONSTRAINT "SalesDeliveryBreakup_proformaSizeBreakupId_fkey" FOREIGN KEY ("proformaSizeBreakupId") REFERENCES "ProformaSizeBreakup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
