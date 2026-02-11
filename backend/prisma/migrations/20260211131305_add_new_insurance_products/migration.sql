-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'FIRE';
ALTER TYPE "ProductType" ADD VALUE 'PROPERTY';
ALTER TYPE "ProductType" ADD VALUE 'BUSINESS';
ALTER TYPE "ProductType" ADD VALUE 'HOME';
ALTER TYPE "ProductType" ADD VALUE 'LIABILITY';
