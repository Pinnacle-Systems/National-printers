-- AlterTable
ALTER TABLE "InwardItems" ADD COLUMN     "orderEntryId" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseCancel" ADD COLUMN     "finYearId" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseInward" ADD COLUMN     "finYearId" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseInwardReturn" ADD COLUMN     "finYearId" INTEGER;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "jobCardId" INTEGER,
ADD COLUMN     "orderId" INTEGER,
ADD COLUMN     "salesReturnId" INTEGER,
ADD COLUMN     "styleId" INTEGER;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInward" ADD CONSTRAINT "PurchaseInward_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InwardItems" ADD CONSTRAINT "InwardItems_orderEntryId_fkey" FOREIGN KEY ("orderEntryId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInwardReturn" ADD CONSTRAINT "PurchaseInwardReturn_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseCancel" ADD CONSTRAINT "PurchaseCancel_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
