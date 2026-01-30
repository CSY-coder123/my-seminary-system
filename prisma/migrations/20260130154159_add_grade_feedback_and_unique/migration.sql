/*
  Warnings:

  - A unique constraint covering the columns `[studentId,courseId]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "feedback" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_courseId_key" ON "Grade"("studentId", "courseId");
