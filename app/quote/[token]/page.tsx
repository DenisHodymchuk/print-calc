import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { QuoteClient } from './quote-client'

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
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

  if (!calculation) notFound()

  // Resolve AMS material details
  let amsMaterialsResolved: { materialId: string; weightGrams: number; name: string | null; colorHex: string | null }[] | null = null
  if (calculation.amsMaterials) {
    try {
      const amsArr = JSON.parse(calculation.amsMaterials) as { materialId: string; weightGrams: number }[]
      if (amsArr.length > 0) {
        const amsMats = await prisma.material.findMany({
          where: { id: { in: amsArr.map(a => a.materialId) } },
          select: { id: true, name: true, colorHex: true },
        })
        const matMap = Object.fromEntries(amsMats.map(m => [m.id, m]))
        amsMaterialsResolved = amsArr.map(a => ({
          materialId: a.materialId,
          weightGrams: a.weightGrams,
          name: matMap[a.materialId]?.name || null,
          colorHex: matMap[a.materialId]?.colorHex || null,
        }))
      }
    } catch { /* ignore */ }
  }

  const quote = {
    id: calculation.id,
    name: calculation.name,
    status: calculation.status,
    weightGrams: calculation.weightGrams,
    printTimeMinutes: calculation.printTimeMinutes,
    sellingPrice: calculation.sellingPrice,
    discountPercent: calculation.discountPercent,
    copies: calculation.copies,
    clientName: calculation.clientName,
    photoUrl: calculation.photoUrl,
    notes: calculation.notes,
    quoteApprovedAt: calculation.quoteApprovedAt?.toISOString() || null,
    createdAt: calculation.createdAt.toISOString(),
    material: calculation.material,
    printer: calculation.printer,
    seller: calculation.user,
    postProcessSteps: calculation.postProcessSteps,
    amsMaterials: amsMaterialsResolved,
    deliveryDate: (calculation as Record<string, unknown>).deliveryDate ? new Date((calculation as Record<string, unknown>).deliveryDate as string).toISOString() : null,
    marginPercent: calculation.marginPercent,
    totalCost: calculation.totalCost,
  }

  return <QuoteClient quote={quote} token={token} />
}
