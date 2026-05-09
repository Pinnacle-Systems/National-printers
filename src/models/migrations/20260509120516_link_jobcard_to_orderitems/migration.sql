-- AddForeignKey
ALTER TABLE "JobCard" ADD CONSTRAINT "JobCard_orderEntryItemId_fkey" FOREIGN KEY ("orderEntryItemId") REFERENCES "OrderItems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
