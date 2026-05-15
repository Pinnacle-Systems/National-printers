/*
  Warnings:

  - You are about to drop the column `fullBoard` on the `JobCard` table. All the data in the column will be lost.
  - The `jobRunTime` column on the `JobCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `machineId` on the `MachineDetails` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MachineDetails" DROP CONSTRAINT "MachineDetails_machineId_fkey";

-- AlterTable
ALTER TABLE "JobCard" DROP COLUMN "fullBoard",
ADD COLUMN     "cuttingSizeId" INTEGER,
ADD COLUMN     "fullBoardId" INTEGER,
ADD COLUMN     "labelSizeId" INTEGER,
ADD COLUMN     "totalMeter" INTEGER,
DROP COLUMN "jobRunTime",
ADD COLUMN     "jobRunTime" INTEGER;

-- AlterTable
ALTER TABLE "MachineDetails" DROP COLUMN "machineId";

-- CreateTable
CREATE TABLE "FinishingProcess" (
    "id" SERIAL NOT NULL,
    "jobCardId" INTEGER,
    "processId" INTEGER,

    CONSTRAINT "FinishingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingDetails" (
    "id" SERIAL NOT NULL,
    "jobCardId" INTEGER,
    "processId" INTEGER,

    CONSTRAINT "PrintingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlateDetails" (
    "id" SERIAL NOT NULL,
    "jobCardId" INTEGER,
    "plateName" TEXT,
    "qty" INTEGER,

    CONSTRAINT "PlateDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_fullBoardId_fkey" FOREIGN KEY ("fullBoardId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_cuttingSizeId_fkey" FOREIGN KEY ("cuttingSizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_labelSizeId_fkey" FOREIGN KEY ("labelSizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishingProcess" ADD CONSTRAINT "FinishingProcess_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishingProcess" ADD CONSTRAINT "FinishingProcess_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingDetails" ADD CONSTRAINT "PrintingDetails_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingDetails" ADD CONSTRAINT "PrintingDetails_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlateDetails" ADD CONSTRAINT "PlateDetails_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
