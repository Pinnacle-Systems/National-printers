-- AlterTable
ALTER TABLE "BoardQuality" ADD COLUMN     "fullBoardId" INTEGER,
ADD COLUMN     "gsmId" INTEGER,
ADD COLUMN     "noOfSheets" INTEGER,
ADD COLUMN     "processId" INTEGER;

-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "block" TEXT,
ADD COLUMN     "colorId" INTEGER,
ADD COLUMN     "fullBoard" INTEGER,
ADD COLUMN     "isCancelled" BOOLEAN DEFAULT false,
ADD COLUMN     "isHold" BOOLEAN DEFAULT false,
ADD COLUMN     "isNewPlate" BOOLEAN DEFAULT false,
ADD COLUMN     "isOldPlate" BOOLEAN DEFAULT false,
ADD COLUMN     "itemType" TEXT,
ADD COLUMN     "jobCardType" TEXT,
ADD COLUMN     "labelItemId" INTEGER,
ADD COLUMN     "lenght" INTEGER,
ADD COLUMN     "meter" INTEGER,
ADD COLUMN     "orderBranchId" INTEGER,
ADD COLUMN     "otherBoardId" INTEGER,
ADD COLUMN     "plateSupplierId" INTEGER,
ADD COLUMN     "splitType" TEXT,
ADD COLUMN     "storeId" INTEGER,
ADD COLUMN     "trackingType" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "MachineDetails" ADD COLUMN     "machineId" INTEGER;

-- AlterTable
ALTER TABLE "PlateDetails" ADD COLUMN     "description" TEXT,
ADD COLUMN     "machineId" INTEGER,
ADD COLUMN     "plateId" INTEGER;

-- AlterTable
ALTER TABLE "PrintingDetails" ADD COLUMN     "isFront" BOOLEAN DEFAULT false,
ADD COLUMN     "isFrontAndBack" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "LabelPrintingDetails" (
    "id" SERIAL NOT NULL,
    "jobCardId" INTEGER,
    "processId" INTEGER,

    CONSTRAINT "LabelPrintingDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_otherBoardId_fkey" FOREIGN KEY ("otherBoardId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_labelItemId_fkey" FOREIGN KEY ("labelItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_plateSupplierId_fkey" FOREIGN KEY ("plateSupplierId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_orderBranchId_fkey" FOREIGN KEY ("orderBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardQuality" ADD CONSTRAINT "BoardQuality_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardQuality" ADD CONSTRAINT "BoardQuality_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardQuality" ADD CONSTRAINT "BoardQuality_fullBoardId_fkey" FOREIGN KEY ("fullBoardId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelPrintingDetails" ADD CONSTRAINT "LabelPrintingDetails_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelPrintingDetails" ADD CONSTRAINT "LabelPrintingDetails_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlateDetails" ADD CONSTRAINT "PlateDetails_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlateDetails" ADD CONSTRAINT "PlateDetails_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineDetails" ADD CONSTRAINT "MachineDetails_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;
