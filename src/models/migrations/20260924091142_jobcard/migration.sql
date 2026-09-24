-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "isRepeatedJobCard" BOOLEAN DEFAULT false,
ADD COLUMN     "refJobCardId" INTEGER;

-- AlterTable
ALTER TABLE "ProductionAllocation" ADD COLUMN     "branchId" INTEGER;

-- AlterTable
ALTER TABLE "ProductionAllocationDtl" ADD COLUMN     "isFront" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFrontAndBack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processRouteId" INTEGER,
ADD COLUMN     "supplierId" INTEGER;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_refJobCardId_fkey" FOREIGN KEY ("refJobCardId") REFERENCES "JobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionAllocation" ADD CONSTRAINT "ProductionAllocation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionAllocationDtl" ADD CONSTRAINT "ProductionAllocationDtl_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionAllocationDtl" ADD CONSTRAINT "ProductionAllocationDtl_processRouteId_fkey" FOREIGN KEY ("processRouteId") REFERENCES "ProcessRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
