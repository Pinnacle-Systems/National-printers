-- AlterTable
ALTER TABLE "JobCard" ADD COLUMN     "styleImage" BYTEA;

-- AlterTable
ALTER TABLE "OrderItems" ADD COLUMN     "styleImage" BYTEA;

-- AlterTable
ALTER TABLE "PackingOrderItems" ADD COLUMN     "styleImage" BYTEA;

-- AlterTable
ALTER TABLE "ProformaInvoiceItem" ADD COLUMN     "styleImage" BYTEA;

-- AlterTable
ALTER TABLE "SalesBillItems" ADD COLUMN     "styleImage" BYTEA;

-- AlterTable
ALTER TABLE "SalesDeliveryItems" ADD COLUMN     "styleImage" BYTEA;

-- AlterTable
ALTER TABLE "SalesReturnItems" ADD COLUMN     "styleImage" BYTEA;

-- AlterTable
ALTER TABLE "StyleItem" ADD COLUMN     "styleImage" BYTEA;
