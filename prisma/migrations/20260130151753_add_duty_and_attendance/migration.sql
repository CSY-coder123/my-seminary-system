/*
  Warnings:

  - You are about to drop the column `announcement` on the `Cohort` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,courseId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Attendance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "recordedById" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Cohort" DROP COLUMN "announcement";

-- CreateTable
CREATE TABLE "DutyRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "task" TEXT,
    "cohortId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,

    CONSTRAINT "DutyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DutyRecord_cohortId_date_key" ON "DutyRecord"("cohortId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_courseId_date_key" ON "Attendance"("studentId", "courseId", "date");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyRecord" ADD CONSTRAINT "DutyRecord_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyRecord" ADD CONSTRAINT "DutyRecord_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
