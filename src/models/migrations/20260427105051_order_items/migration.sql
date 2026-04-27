-- CreateTable
CREATE TABLE "OrderItems" (
    "id" SERIAL NOT NULL,
    "orderEntryId" INTEGER,
    "styleItemId" INTEGER,
    "orderQty" INTEGER,
    "sizeId" INTEGER,
    "uomId" INTEGER,
    "gsmId" INTEGER,

    CONSTRAINT "OrderItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaInvoice" (
    "id" SERIAL NOT NULL,
    "docId" TEXT NOT NULL,
    "docDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "branchId" INTEGER,
    "companyId" INTEGER,
    "customerId" INTEGER,
    "finYearId" INTEGER,
    "remarks" TEXT,
    "termsAndCondition" TEXT,
    "termsId" INTEGER,
    "orderEntryId" INTEGER,

    CONSTRAINT "ProformaInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaInvoiceItem" (
    "id" SERIAL NOT NULL,
    "proformaInvoiceId" INTEGER NOT NULL,
    "styleItemId" INTEGER,
    "qty" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "taxPercent" DOUBLE PRECISION,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "sizeId" INTEGER,
    "uomId" INTEGER,
    "gsmId" INTEGER,
    "productId" INTEGER,

    CONSTRAINT "ProformaInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaAttachments" (
    "id" SERIAL NOT NULL,
    "proformaInvoiceId" INTEGER,
    "date" TIMESTAMP(3),
    "name" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,

    CONSTRAINT "ProformaAttachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_orderEntryId_fkey" FOREIGN KEY ("orderEntryId") REFERENCES "OrderEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_finYearId_fkey" FOREIGN KEY ("finYearId") REFERENCES "FinYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_termsId_fkey" FOREIGN KEY ("termsId") REFERENCES "TermsAndConditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_orderEntryId_fkey" FOREIGN KEY ("orderEntryId") REFERENCES "OrderEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_proformaInvoiceId_fkey" FOREIGN KEY ("proformaInvoiceId") REFERENCES "ProformaInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_styleItemId_fkey" FOREIGN KEY ("styleItemId") REFERENCES "StyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "Uom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "Gsm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaInvoiceItem" ADD CONSTRAINT "ProformaInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaAttachments" ADD CONSTRAINT "ProformaAttachments_proformaInvoiceId_fkey" FOREIGN KEY ("proformaInvoiceId") REFERENCES "ProformaInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
