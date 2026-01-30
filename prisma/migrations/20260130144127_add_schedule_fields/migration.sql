-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;
