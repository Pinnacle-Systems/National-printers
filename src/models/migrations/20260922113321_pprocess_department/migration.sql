/*
  Warnings:

  - You are about to drop the column `isOutSide` on the `Process` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Process" DROP COLUMN "isOutSide",
ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "isOutsideJob" BOOLEAN DEFAULT false;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
