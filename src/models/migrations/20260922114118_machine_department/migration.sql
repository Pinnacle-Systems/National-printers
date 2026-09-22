-- AlterTable
ALTER TABLE "Machine" ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "isDefault" BOOLEAN DEFAULT false;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
