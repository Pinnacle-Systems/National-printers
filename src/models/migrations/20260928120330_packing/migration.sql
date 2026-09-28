-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "packingId" INTEGER;

-- CreateTable
CREATE TABLE "Packing" (
    "id" SERIAL NOT NULL,
    "docId" TEXT NOT NULL,
    "docDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "branchId" INTEGER,
    "orderId" INTEGER,
    "jobCardId" INTEGER,
    "orderType" TEXT,
    "finYearId" INTEGER,
    "remarks" TEXT,

    CONSTRAINT "Packing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingOrderItems" (
    "id" SERIAL NOT NULL,
    "packingId" INTEGER,
    "styleItemId" INTEGER,
    "itemGroupId" INTEGER,
    "hsnId" INTEGER,
    "trackingType" TEXT,
    "uomId" INTEGER,
    "gsmId" INTEGER,
    "orderQty" INTEGER,

    CONSTRAINT "PackingOrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingSizeBreakup" (
    "id" SERIAL NOT NULL,
    "PackingOrderItemsId" INTEGER NOT NULL,
    "orderSizeBreakupId" INTEGER,
    "sizeId" INTEGER,
    "barcodeFrom" TEXT,
    "barcodeTo" TEXT,
    "description" TEXT,
    "qty" DOUBLE PRECISION,
    "packingQty" DOUBLE PRECISION,
    "netWeight" DOUBLE PRECISION,
    "grossWeight" DOUBLE PRECISION,
    "dimensions" TEXT,

    CONSTRAINT "PackingSizeBreakup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingItems" (
    "id" SERIAL NOT NULL,
    "PackingSizeBreakupId" INTEGER NOT NULL,
    "packingUomId" INTEGER,
    "qty" DOUBLE PRECISION,
    "noOfunits" DOUBLE PRECISION,

    CONSTRAINT "PackingItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Packing_docId_key" ON "Packing"("docId");

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_packingId_fkey" FOREIGN KEY ("packingId") REFERENCES "Packing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_jobCardId_fkey" FOREIGN KEY ("jobCardId") REFERENCES "JobCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingOrderItems" ADD CONSTRAINT "PackingOrderItems_packingId_fkey" FOREIGN KEY ("packingId") REFERENCES "Packing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingOrderItems" ADD CONSTRAINT "PackingOrderItems_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingOrderItems" ADD CONSTRAINT "PackingOrderItems_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingOrderItems" ADD CONSTRAINT "PackingOrderItems_hsnId_fkey" FOREIGN KEY ("hsnId") REFERENCES "Hsn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingOrderItems" ADD CONSTRAINT "PackingOrderItems_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingOrderItems" ADD CONSTRAINT "PackingOrderItems_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSizeBreakup" ADD CONSTRAINT "PackingSizeBreakup_PackingOrderItemsId_fkey" FOREIGN KEY ("PackingOrderItemsId") REFERENCES "PackingOrderItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSizeBreakup" ADD CONSTRAINT "PackingSizeBreakup_orderSizeBreakupId_fkey" FOREIGN KEY ("orderSizeBreakupId") REFERENCES "OrderSizeBreakup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSizeBreakup" ADD CONSTRAINT "PackingSizeBreakup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_PackingSizeBreakupId_fkey" FOREIGN KEY ("PackingSizeBreakupId") REFERENCES "PackingSizeBreakup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingItems" ADD CONSTRAINT "PackingItems_packingUomId_fkey" FOREIGN KEY ("packingUomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
