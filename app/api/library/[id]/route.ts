import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const model = await prisma.model.findFirst({
    where: { id, userId: session.user.id },
    include: {
      calculations: {
        select: {
          id: true, name: true, weightGrams: true, printTimeMinutes: true,
          materialCost: true, machineCost: true, laborCost: true, overheadCost: true,
          totalCost: true, sellingPrice: true, marginPercent: true, copies: true,
          infillPercent: true, layerHeight: true, hasSupports: true,
          photoUrl: true, createdAt: true, amsMaterials: true,
          material: { select: { name: true, type: true, colorHex: true, color: true } },
          printer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Enrich AMS materials with name/colorHex
  const allAmsMatIds = new Set<string>()
  for (const c of model.calculations) {
    if (c.amsMaterials) {
      try {
        const arr = JSON.parse(c.amsMaterials) as { materialId: string }[]
        arr.forEach(a => allAmsMatIds.add(a.materialId))
      } catch { /* ignore */ }
    }
  }
  let enrichedCalcs = model.calculations
  if (allAmsMatIds.size > 0) {
    const mats = await prisma.material.findMany({
      where: { id: { in: Array.from(allAmsMatIds) } },
      select: { id: true, name: true, type: true, colorHex: true },
    })
    const matMap = Object.fromEntries(mats.map(m => [m.id, m]))
    enrichedCalcs = model.calculations.map(c => {
      if (!c.amsMaterials) return c
      try {
        const arr = JSON.parse(c.amsMaterials) as { materialId: string; weightGrams: number }[]
        const enrichedAms = arr.map(a => ({
          ...a,
          name: matMap[a.materialId]?.name || null,
          type: matMap[a.materialId]?.type || null,
          colorHex: matMap[a.materialId]?.colorHex || null,
        }))
        return { ...c, amsMaterials: JSON.stringify(enrichedAms) }
      } catch { return c }
    })
  }

  return NextResponse.json({ ...model, calculations: enrichedCalcs })
}
