import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateCosts, calculateSellingPrice } from '@/lib/cost-calculator'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const materialId = searchParams.get('materialId')
  const printerId = searchParams.get('printerId')
  const search = searchParams.get('search')

  const calculations = await prisma.calculation.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as never } : {}),
      ...(materialId ? { materialId } : {}),
      ...(printerId ? { printerId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      material: { select: { name: true, type: true, colorHex: true } },
      printer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Enrich AMS materials with name/colorHex
  const allAmsMatIds = new Set<string>()
  for (const c of calculations) {
    if (c.amsMaterials) {
      try {
        const arr = JSON.parse(c.amsMaterials as string) as { materialId: string }[]
        arr.forEach(a => allAmsMatIds.add(a.materialId))
      } catch { /* ignore */ }
    }
  }
  let amsMaterialsMap: Record<string, { name: string; type: string; colorHex: string | null }> = {}
  if (allAmsMatIds.size > 0) {
    const mats = await prisma.material.findMany({
      where: { id: { in: Array.from(allAmsMatIds) } },
      select: { id: true, name: true, type: true, colorHex: true },
    })
    amsMaterialsMap = Object.fromEntries(mats.map(m => [m.id, { name: m.name, type: m.type, colorHex: m.colorHex }]))
  }

  const enriched = calculations.map(c => {
    if (!c.amsMaterials) return c
    try {
      const arr = JSON.parse(c.amsMaterials as string) as { materialId: string; weightGrams: number }[]
      const enrichedAms = arr.map(a => ({
        ...a,
        name: amsMaterialsMap[a.materialId]?.name || null,
        type: amsMaterialsMap[a.materialId]?.type || null,
        colorHex: amsMaterialsMap[a.materialId]?.colorHex || null,
      }))
      return { ...c, amsMaterials: JSON.stringify(enrichedAms) }
    } catch { return c }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let material = null
  let printer = null

  if (body.materialId) {
    material = await prisma.material.findFirst({ where: { id: body.materialId, userId: session.user.id } })
  }
  if (body.printerId) {
    printer = await prisma.printer.findFirst({ where: { id: body.printerId, userId: session.user.id } })
  }

  const postStepsCost = (body.postProcessSteps || []).reduce(
    (sum: number, s: { materialCost?: number }) => sum + (s.materialCost || 0), 0
  )

  // AMS: resolve multiple materials
  let amsInputs = undefined
  const amsRaw = body.amsMaterials as { materialId: string; weightGrams: string }[] | undefined
  if (amsRaw && Array.isArray(amsRaw) && amsRaw.length > 0) {
    const amsMats = await prisma.material.findMany({
      where: { id: { in: amsRaw.map(a => a.materialId) }, userId: session.user.id },
    })
    amsInputs = amsRaw.map(a => {
      const mat = amsMats.find(m => m.id === a.materialId)
      return { weightGrams: parseFloat(String(a.weightGrams)) || 0, pricePerKg: mat?.pricePerKg || 0, failureRate: mat?.failureRate || 0 }
    })
  }

  const amsWeightTotal = (amsRaw && amsRaw.length > 0)
    ? amsRaw.reduce((s: number, a: { weightGrams: string }) => s + (parseFloat(String(a.weightGrams)) || 0), 0)
    : 0

  const costs = calculateCosts({
    weightGrams: amsWeightTotal > 0 ? amsWeightTotal : (parseFloat(body.weightGrams) || 0),
    pricePerKg: material?.pricePerKg || 0,
    failureRate: material?.failureRate || 0,
    amsMaterials: amsInputs,
    printTimeMinutes: parseFloat(body.printTimeMinutes) || 0,
    purchasePrice: printer?.purchasePrice || 0,
    lifetimeHours: printer?.lifetimeHours || 2000,
    maintenanceReservePerHour: printer?.maintenanceReservePerHour || 0,
    powerWatts: printer?.powerWatts || 0,
    electricityRate: user.electricityRate || 4.32,
    setupMinutes: parseFloat(body.setupMinutes) || 15,
    postProcMinutes: parseFloat(body.postProcMinutes) || 0,
    hourlyRate: user.hourlyRate || 0,
    postProcessStepsCost: postStepsCost,
    copies: parseInt(body.copies) || 1,
  })

  const sellingPrice = calculateSellingPrice(
    costs.totalCost,
    parseFloat(body.marginPercent) || 30,
    parseFloat(body.discountPercent) || 0
  )

  const quoteToken = crypto.randomBytes(16).toString('hex')

  const calcData = {
    userId: session.user.id,
    name: body.name || 'Новий розрахунок',
    printerId: body.printerId || null,
    materialId: body.materialId || null,
    status: body.status || (body.clientName ? 'QUOTED' : 'DRAFT'),
    weightGrams: amsWeightTotal > 0 ? amsWeightTotal : (parseFloat(body.weightGrams) || 0),
    printTimeMinutes: parseFloat(body.printTimeMinutes) || 0,
    layerHeight: parseFloat(body.layerHeight) || 0.2,
    infillPercent: parseFloat(body.infillPercent) || 15,
    hasSupports: body.hasSupports || false,
    supportDensity: parseFloat(body.supportDensity) || 15,
    copies: parseInt(body.copies) || 1,
    setupMinutes: parseFloat(body.setupMinutes) || 15,
    postProcMinutes: parseFloat(body.postProcMinutes) || 0,
    ...costs,
    marginPercent: parseFloat(body.marginPercent) || 30,
    discountPercent: parseFloat(body.discountPercent) || 0,
    sellingPrice,
    clientName: body.clientName || null,
    clientEmail: body.clientEmail || null,
    deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
    quoteToken,
    modelId: body.modelId || null,
    amsMaterials: amsRaw ? JSON.stringify(amsRaw.map((a: { materialId: string; weightGrams: string }) => ({ materialId: a.materialId, weightGrams: parseFloat(String(a.weightGrams)) || 0 }))) : null,
    photoUrl: body.photoUrl || null,
    notes: body.notes || null,
    postProcessSteps: {
      create: (body.postProcessSteps || []).map((s: { name: string; timeMinutes: number; materialCost: number }) => ({
        name: s.name,
        timeMinutes: s.timeMinutes || 0,
        materialCost: s.materialCost || 0,
      })),
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculation = await prisma.calculation.create({
    data: calcData as any,
    include: { postProcessSteps: true },
  })

  return NextResponse.json(calculation, { status: 201 })
}
