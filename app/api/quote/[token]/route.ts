import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const calculation = await prisma.calculation.findUnique({
    where: { quoteToken: token },
    include: {
      material: { select: { name: true, type: true, colorHex: true, color: true } },
      printer: { select: { name: true } },
      user: { select: { name: true, businessName: true, email: true } },
      postProcessSteps: true,
    },
  })

  if (!calculation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Return only safe public fields
  return NextResponse.json({
    id: calculation.id,
    name: calculation.name,
    status: calculation.status,
    weightGrams: calculation.weightGrams,
    printTimeMinutes: calculation.printTimeMinutes,
    sellingPrice: calculation.sellingPrice,
    discountPercent: calculation.discountPercent,
    marginPercent: calculation.marginPercent,
    copies: calculation.copies,
    clientName: calculation.clientName,
    photoUrl: calculation.photoUrl,
    notes: calculation.notes,
    quoteApprovedAt: calculation.quoteApprovedAt,
    createdAt: calculation.createdAt,
    material: calculation.material,
    printer: calculation.printer,
    seller: calculation.user,
    postProcessSteps: calculation.postProcessSteps,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const calculation = await prisma.calculation.findUnique({ where: { quoteToken: token } })
  if (!calculation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (calculation.quoteApprovedAt) {
    return NextResponse.json({ error: 'Вже підтверджено' }, { status: 400 })
  }

  let body: { copies?: number } = {}
  try { body = await req.json() } catch { /* no body */ }

  const pricePerUnit = calculation.sellingPrice / calculation.copies
  const newCopies = body.copies && body.copies >= 1 ? body.copies : calculation.copies
  const newSellingPrice = pricePerUnit * newCopies

  const updated = await prisma.calculation.update({
    where: { quoteToken: token },
    data: {
      quoteApprovedAt: new Date(),
      status: 'APPROVED',
      copies: newCopies,
      sellingPrice: newSellingPrice,
    },
  })

  return NextResponse.json({ success: true, approvedAt: updated.quoteApprovedAt })
}
