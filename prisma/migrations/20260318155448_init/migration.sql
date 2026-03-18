-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'NYLON', 'RESIN', 'OTHER');

-- CreateEnum
CREATE TYPE "CalculationStatus" AS ENUM ('DRAFT', 'QUOTED', 'APPROVED', 'PRINTING', 'DONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "businessName" TEXT,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "electricityRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Printer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "powerWatts" DOUBLE PRECISION NOT NULL,
    "lifetimeHours" DOUBLE PRECISION NOT NULL DEFAULT 2000,
    "maintenanceReservePerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "color" TEXT,
    "colorHex" TEXT,
    "type" "MaterialType" NOT NULL DEFAULT 'PLA',
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "density" DOUBLE PRECISION NOT NULL DEFAULT 1.24,
    "failureRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialPurchase" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "printerId" TEXT,
    "materialId" TEXT,
    "name" TEXT NOT NULL,
    "status" "CalculationStatus" NOT NULL DEFAULT 'DRAFT',
    "weightGrams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "printTimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "layerHeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "infillPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "hasSupports" BOOLEAN NOT NULL DEFAULT false,
    "supportDensity" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "setupMinutes" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "postProcMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "materialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "machineCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overheadCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clientName" TEXT,
    "clientEmail" TEXT,
    "quoteToken" TEXT,
    "quoteApprovedAt" TIMESTAMP(3),
    "photoUrl" TEXT,
    "stlFileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostProcessingStep" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "materialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PostProcessingStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Calculation_quoteToken_key" ON "Calculation"("quoteToken");

-- AddForeignKey
ALTER TABLE "Printer" ADD CONSTRAINT "Printer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialPurchase" ADD CONSTRAINT "MaterialPurchase_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostProcessingStep" ADD CONSTRAINT "PostProcessingStep_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
