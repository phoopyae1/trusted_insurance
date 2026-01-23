/*
  Warnings:

  - Added the required column `updatedAt` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ClaimStatus" ADD VALUE 'PARTIALLY_APPROVED';

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "approvedAmount" DOUBLE PRECISION,
ADD COLUMN     "assessedAt" TIMESTAMP(3),
ADD COLUMN     "assessedBy" INTEGER,
ADD COLUMN     "decisionReason" TEXT,
ADD COLUMN     "deductible" DOUBLE PRECISION,
ADD COLUMN     "eligibleAmount" DOUBLE PRECISION,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Set updatedAt for existing rows to createdAt (or current timestamp)
UPDATE "Claim" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Now make updatedAt NOT NULL
ALTER TABLE "Claim" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
