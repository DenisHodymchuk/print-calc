import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalCalcs,
    thisMonthCalcs,
    lastMonthCalcs,
    recentCalcs,
    materialCount,
    printerCount,
  ] = await Promise.all([
    prisma.calculation.count({ where: { userId } }),
    prisma.calculation.findMany({
      where: { userId, createdAt: { gte: startOfMonth } },
      select: { sellingPrice: true, totalCost: true },
    }),
    prisma.calculation.findMany({
      where: { userId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      select: { sellingPrice: true, totalCost: true },
    }),
    prisma.calculation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        material: { select: { name: true, colorHex: true } },
        printer: { select: { name: true } },
      },
    }),
    prisma.material.count({ where: { userId } }),
    prisma.printer.count({ where: { userId } }),
  ])

  // Monthly revenue chart (last 6 months)
  const months: { month: string; revenue: number; cost: number; profit: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const calcs = await prisma.calculation.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      select: { sellingPrice: true, totalCost: true },
    })
    const revenue = calcs.reduce((s, c) => s + c.sellingPrice, 0)
    const cost = calcs.reduce((s, c) => s + c.totalCost, 0)
    months.push({
      month: start.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }),
      revenue: parseFloat(revenue.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      profit: parseFloat((revenue - cost).toFixed(2)),
    })
  }

  const thisRevenue = thisMonthCalcs.reduce((s, c) => s + c.sellingPrice, 0)
  const thisCost = thisMonthCalcs.reduce((s, c) => s + c.totalCost, 0)
  const lastRevenue = lastMonthCalcs.reduce((s, c) => s + c.sellingPrice, 0)

  return NextResponse.json({
    totalCalcs,
    materialCount,
    printerCount,
    thisMonth: {
      revenue: parseFloat(thisRevenue.toFixed(2)),
      cost: parseFloat(thisCost.toFixed(2)),
      profit: parseFloat((thisRevenue - thisCost).toFixed(2)),
      count: thisMonthCalcs.length,
    },
    lastMonth: {
      revenue: parseFloat(lastRevenue.toFixed(2)),
    },
    recentCalcs,
    monthlyChart: months,
  })
}
