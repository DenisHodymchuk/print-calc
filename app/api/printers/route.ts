import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const printers = await prisma.printer.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(printers)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, brand, purchasePrice, powerWatts, lifetimeHours, maintenanceReservePerHour, notes } = body

  if (!name || !purchasePrice || !powerWatts) {
    return NextResponse.json({ error: "Назва, ціна та потужність обов'язкові" }, { status: 400 })
  }

  const printer = await prisma.printer.create({
    data: {
      userId: session.user.id,
      name,
      brand,
      purchasePrice: parseFloat(purchasePrice),
      powerWatts: parseFloat(powerWatts),
      lifetimeHours: lifetimeHours ? parseFloat(lifetimeHours) : 2000,
      maintenanceReservePerHour: maintenanceReservePerHour ? parseFloat(maintenanceReservePerHour) : 0,
      notes,
    },
  })

  return NextResponse.json(printer, { status: 201 })
}
