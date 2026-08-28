-- AlterTable
ALTER TABLE "OrderEntry" ADD COLUMN     "orderBranchId" INTEGER;

-- AddForeignKey
ALTER TABLE "OrderEntry" ADD CONSTRAINT "OrderEntry_orderBranchId_fkey" FOREIGN KEY ("orderBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
