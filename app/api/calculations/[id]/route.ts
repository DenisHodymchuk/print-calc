import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateCosts, calculateSellingPrice } from '@/lib/cost-calculator'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const calculation = await prisma.calculation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      material: true,
      printer: true,
      postProcessSteps: true,
    },
  })

  if (!calculation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(calculation)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.calculation.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let material = null
  let printer = null
  const matId = body.materialId ?? existing.materialId
  const printId = body.printerId ?? existing.printerId

  if (matId) material = await prisma.material.findFirst({ where: { id: matId, userId: session.user.id } })
  if (printId) printer = await prisma.printer.findFirst({ where: { id: printId, userId: session.user.id } })

  const postStepsCost = (body.postProcessSteps || []).reduce(
    (sum: number, s: { materialCost?: number }) => sum + (s.materialCost || 0), 0
  )

  // AMS materials
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

  const costs = calculateCosts({
    weightGrams: parseFloat(body.weightGrams ?? existing.weightGrams) || 0,
    pricePerKg: material?.pricePerKg || 0,
    failureRate: material?.failureRate || 0,
    amsMaterials: amsInputs,
    printTimeMinutes: parseFloat(body.printTimeMinutes ?? existing.printTimeMinutes) || 0,
    purchasePrice: printer?.purchasePrice || 0,
    lifetimeHours: printer?.lifetimeHours || 2000,
    maintenanceReservePerHour: printer?.maintenanceReservePerHour || 0,
    powerWatts: printer?.powerWatts || 0,
    electricityRate: user.electricityRate || 4.32,
    setupMinutes: parseFloat(body.setupMinutes ?? existing.setupMinutes) || 15,
    postProcMinutes: parseFloat(body.postProcMinutes ?? existing.postProcMinutes) || 0,
    hourlyRate: user.hourlyRate || 0,
    postProcessStepsCost: postStepsCost,
    copies: parseInt(body.copies ?? existing.copies) || 1,
  })

  const sellingPrice = calculateSellingPrice(
    costs.totalCost,
    parseFloat(body.marginPercent ?? existing.marginPercent) || 30,
    parseFloat(body.discountPercent ?? existing.discountPercent) || 0
  )

  // Replace post-process steps if provided
  if (body.postProcessSteps !== undefined) {
    await prisma.postProcessingStep.deleteMany({ where: { calculationId: id } })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await prisma.calculation.update({
    where: { id },
    data: ({
      name: body.name ?? existing.name,
      printerId: body.printerId !== undefined ? body.printerId : existing.printerId,
      materialId: body.materialId !== undefined ? body.materialId : existing.materialId,
      status: body.status ?? existing.status,
      weightGrams: parseFloat(body.weightGrams ?? existing.weightGrams),
      printTimeMinutes: parseFloat(body.printTimeMinutes ?? existing.printTimeMinutes),
      layerHeight: parseFloat(body.layerHeight ?? existing.layerHeight),
      infillPercent: parseFloat(body.infillPercent ?? existing.infillPercent),
      hasSupports: body.hasSupports ?? existing.hasSupports,
      supportDensity: parseFloat(body.supportDensity ?? existing.supportDensity),
      copies: parseInt(body.copies ?? existing.copies),
      setupMinutes: parseFloat(body.setupMinutes ?? existing.setupMinutes),
      postProcMinutes: parseFloat(body.postProcMinutes ?? existing.postProcMinutes),
      ...costs,
      marginPercent: parseFloat(body.marginPercent ?? existing.marginPercent),
      discountPercent: parseFloat(body.discountPercent ?? existing.discountPercent),
      sellingPrice,
      clientName: body.clientName !== undefined ? body.clientName : existing.clientName,
      clientEmail: body.clientEmail !== undefined ? body.clientEmail : existing.clientEmail,
      photoUrl: body.photoUrl !== undefined ? (body.photoUrl || null) : existing.photoUrl,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      category: body.category !== undefined ? body.category : existing.category,
      modelId: body.modelId !== undefined ? body.modelId : existing.modelId,
      amsMaterials: amsRaw ? JSON.stringify(amsRaw.map((a: { materialId: string; weightGrams: string }) => ({ materialId: a.materialId, weightGrams: parseFloat(String(a.weightGrams)) || 0 }))) : (body.amsMaterials === null ? null : undefined),
      ...(body.quoteApproved ? { quoteApprovedAt: new Date(), status: 'APPROVED' } : {}),
      ...(body.postProcessSteps !== undefined ? {
        postProcessSteps: {
          create: body.postProcessSteps.map((s: { name: string; timeMinutes: number; materialCost: number }) => ({
            name: s.name,
            timeMinutes: s.timeMinutes || 0,
            materialCost: s.materialCost || 0,
          })),
        },
      } : {}),
    }) as any,
    include: { postProcessSteps: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.calculation.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.calculation.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
