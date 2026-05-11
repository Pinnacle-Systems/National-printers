-- AlterTable
ALTER TABLE "ProformaInvoice" ADD COLUMN     "deliveryCharge" DOUBLE PRECISION,
ADD COLUMN     "deliveryCustomerId" INTEGER,
ADD COLUMN     "deliveryType" TEXT,
ADD COLUMN     "modeOfPayment" TEXT;

-- AddForeignKey
ALTER TABLE "ProformaInvoice" ADD CONSTRAINT "ProformaInvoice_deliveryCustomerId_fkey" FOREIGN KEY ("deliveryCustomerId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;
