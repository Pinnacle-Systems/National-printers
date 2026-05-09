-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "followUpId" INTEGER,
ADD COLUMN     "itemGroup" TEXT,
ADD COLUMN     "labelBlock" TEXT,
ADD COLUMN     "labelCutAndSeal" TEXT,
ADD COLUMN     "labelQuality" TEXT,
ADD COLUMN     "labelRollQty" TEXT;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_followUpId_fkey" FOREIGN KEY ("followUpId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
