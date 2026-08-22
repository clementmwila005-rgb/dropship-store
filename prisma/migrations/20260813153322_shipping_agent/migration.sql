-- AlterTable
ALTER TABLE "Order" ADD COLUMN "agentAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentCity" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentName" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentProvince" TEXT;
ALTER TABLE "Order" ADD COLUMN "agentZip" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "agentAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "agentCity" TEXT;
ALTER TABLE "User" ADD COLUMN "agentName" TEXT;
ALTER TABLE "User" ADD COLUMN "agentPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "agentProvince" TEXT;
ALTER TABLE "User" ADD COLUMN "agentZip" TEXT;
