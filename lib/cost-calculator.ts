export interface MaterialInput {
  weightGrams: number
  pricePerKg: number
  failureRate: number // 0-1
}

export interface CostInputs {
  // Material (single or AMS multi-material)
  weightGrams: number
  pricePerKg: number
  failureRate: number // 0-1
  amsMaterials?: MaterialInput[] // if provided, overrides single material

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
  } = inputs

  const printTimeHours = printTimeMinutes / 60
  const laborHours = (setupMinutes + postProcMinutes) / 60

  // Weight and time from slicer are TOTAL (for all copies on bed)
  // Material cost — total for entire print
  let materialCost: number
  if (inputs.amsMaterials && inputs.amsMaterials.length > 0) {
    materialCost = inputs.amsMaterials.reduce((sum, m) =>
      sum + (m.weightGrams / 1000) * m.pricePerKg * (1 + m.failureRate), 0)
  } else {
    materialCost = (weightGrams / 1000) * pricePerKg * (1 + failureRate)
  }

  // Machine cost — total for entire print time
  const depreciationPerHour = lifetimeHours > 0 ? purchasePrice / lifetimeHours : 0
  const electricityPerHour = (powerWatts / 1000) * electricityRate
  const machineCost = printTimeHours * (depreciationPerHour + electricityPerHour + maintenanceReservePerHour)

  // Labor cost — setup done once for the batch
  const laborCost = laborHours * hourlyRate + postProcessStepsCost

  // Overhead (10% of material + machine)
  const overheadCost = (materialCost + machineCost) * 0.1

  const totalCost = materialCost + machineCost + laborCost + overheadCost

  return {
    materialCost,
    machineCost,
    laborCost,
    overheadCost,
    totalCost,
  }
}

export function calculateSellingPrice(totalCost: number, marginPercent: number, discountPercent: number): number {
  const withMargin = totalCost * (1 + marginPercent / 100)
  return withMargin * (1 - discountPercent / 100)
}
