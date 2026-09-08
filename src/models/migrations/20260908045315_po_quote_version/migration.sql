-- DropForeignKey
ALTER TABLE "QuoteVersion" DROP CONSTRAINT "QuoteVersion_poId_fkey";

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_poId_fkey" FOREIGN KEY ("poId") REFERENCES "Po"("id") ON DELETE CASCADE ON UPDATE CASCADE;
