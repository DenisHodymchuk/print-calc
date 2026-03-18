export interface CostInputs {
  // Material
  weightGrams: number
  pricePerKg: number
  failureRate: number // 0-1

  // Machine
  printTimeMinutes: number
  purchasePrice: number
  lifetimeHours: number
  maintenanceReservePerHour: number
  powerWatts: number
  electricityRate: number // ₴/kWh

  // Labor
  setupMinutes: number
  postProcMinutes: number
  hourlyRate: number

  // Post-processing steps
  postProcessStepsCost: number

  // Copies
  copies: number
}

export interface CostBreakdown {
  materialCost: number
  machineCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
}

export function calculateCosts(inputs: CostInputs): CostBreakdown {
  const {
    weightGrams, pricePerKg, failureRate,
    printTimeMinutes, purchasePrice, lifetimeHours, maintenanceReservePerHour, powerWatts, electricityRate,
    setupMinutes, postProcMinutes, hourlyRate,
    postProcessStepsCost,
    copies,
  } = inputs

  const printTimeHours = printTimeMinutes / 60
  const laborHours = (setupMinutes + postProcMinutes) / 60

  // Material cost per unit (with failure rate buffer)
  const materialCostPerUnit = (weightGrams / 1000) * pricePerKg * (1 + failureRate)

  // Machine cost per unit
  const depreciationPerHour = lifetimeHours > 0 ? purchasePrice / lifetimeHours : 0
  const electricityPerHour = (powerWatts / 1000) * electricityRate
  const machineCostPerUnit = printTimeHours * (depreciationPerHour + electricityPerHour + maintenanceReservePerHour)

  // Labor cost (shared across copies)
  const laborCostPerUnit = (laborHours * hourlyRate + postProcessStepsCost) / Math.max(copies, 1)

  // Overhead (10% of material + machine)
  const baseOverhead = (materialCostPerUnit + machineCostPerUnit) * 0.1
  const overheadCost = baseOverhead

  const totalCost = (materialCostPerUnit + machineCostPerUnit + laborCostPerUnit + overheadCost) * copies

  return {
    materialCost: materialCostPerUnit * copies,
    machineCost: machineCostPerUnit * copies,
    laborCost: laborCostPerUnit * copies,
    overheadCost: overheadCost * copies,
    totalCost,
  }
}

export function calculateSellingPrice(totalCost: number, marginPercent: number, discountPercent: number): number {
  const withMargin = totalCost * (1 + marginPercent / 100)
  return withMargin * (1 - discountPercent / 100)
}
