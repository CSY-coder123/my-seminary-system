/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `DutyRecord` table. All the data in the column will be lost.
  - You are about to drop the column `task` on the `DutyRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DutyRecord" DROP CONSTRAINT "DutyRecord_assigneeId_fkey";

-- AlterTable
ALTER TABLE "DutyRecord" DROP COLUMN "assigneeId",
DROP COLUMN "task";

-- CreateTable
CREATE TABLE "_DutyRecordToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DutyRecordToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DutyRecordToUser_B_index" ON "_DutyRecordToUser"("B");

-- AddForeignKey
ALTER TABLE "_DutyRecordToUser" ADD CONSTRAINT "_DutyRecordToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DutyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DutyRecordToUser" ADD CONSTRAINT "_DutyRecordToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
