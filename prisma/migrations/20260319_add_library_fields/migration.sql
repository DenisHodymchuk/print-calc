-- AlterTable
ALTER TABLE "Calculation" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Calculation" ADD COLUMN "category" TEXT;
