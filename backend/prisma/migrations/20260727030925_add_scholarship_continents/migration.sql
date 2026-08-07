-- AlterTable
ALTER TABLE "scholarships" ADD COLUMN     "continents" TEXT[] DEFAULT ARRAY[]::TEXT[];
