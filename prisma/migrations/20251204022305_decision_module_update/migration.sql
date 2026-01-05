-- AlterTable
ALTER TABLE "Decision" ADD COLUMN     "averageConfidence" DOUBLE PRECISION,
ADD COLUMN     "averageScore" DOUBLE PRECISION,
ADD COLUMN     "finalDecision" TEXT,
ADD COLUMN     "reviewCount" INTEGER;
