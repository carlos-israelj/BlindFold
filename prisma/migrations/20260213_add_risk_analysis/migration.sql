-- CreateTable
CREATE TABLE "RiskAnalysis" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "portfolioCid" TEXT NOT NULL,
    "hhi" DOUBLE PRECISION NOT NULL,
    "concentration" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "assetsCount" INTEGER NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiskAnalysis_accountId_idx" ON "RiskAnalysis"("accountId");

-- CreateIndex
CREATE INDEX "RiskAnalysis_createdAt_idx" ON "RiskAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "RiskAnalysis" ADD CONSTRAINT "RiskAnalysis_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "User"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;
