/*
  Warnings:

  - You are about to drop the `RiskAnalysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RiskAnalysis" DROP CONSTRAINT "RiskAnalysis_accountId_fkey";

-- DropTable
DROP TABLE "RiskAnalysis";

-- CreateTable
CREATE TABLE "RiskAlert" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "hhi" INTEGER NOT NULL,
    "concentration" TEXT NOT NULL,
    "assetsCount" INTEGER NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "recommendations" JSONB,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiskAlert_accountId_idx" ON "RiskAlert"("accountId");

-- CreateIndex
CREATE INDEX "RiskAlert_severity_idx" ON "RiskAlert"("severity");

-- CreateIndex
CREATE INDEX "RiskAlert_acknowledged_idx" ON "RiskAlert"("acknowledged");

-- CreateIndex
CREATE INDEX "RiskAlert_createdAt_idx" ON "RiskAlert"("createdAt");
