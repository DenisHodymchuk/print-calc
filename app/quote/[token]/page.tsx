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
  }

  return <QuoteClient quote={quote} token={token} />
}
