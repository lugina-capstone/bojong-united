-- AlterTable
ALTER TABLE "materials" ADD COLUMN "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[];
