-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "proformaInvoiceApprovalEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proformaInvoiceEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "proformaInvoiceId" INTEGER;

-- AlterTable
ALTER TABLE "OrderEntry" ADD COLUMN     "productionType" TEXT;

-- AlterTable
ALTER TABLE "ProformaInvoice" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quoteVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "userDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProformaInvoiceItem" ADD COLUMN     "quoteVersion" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_proformaInvoiceId_fkey" FOREIGN KEY ("proformaInvoiceId") REFERENCES "ProformaInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
