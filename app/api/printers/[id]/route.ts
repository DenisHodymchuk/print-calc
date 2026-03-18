import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function getPrinter(id: string, userId: string) {
  return prisma.printer.findFirst({ where: { id, userId } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getPrinter(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.printer.update({
    where: { id },
    data: {
      name: body.name,
      brand: body.brand,
      purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : undefined,
      powerWatts: body.powerWatts ? parseFloat(body.powerWatts) : undefined,
      lifetimeHours: body.lifetimeHours ? parseFloat(body.lifetimeHours) : undefined,
      maintenanceReservePerHour: body.maintenanceReservePerHour !== undefined
        ? parseFloat(body.maintenanceReservePerHour) : undefined,
      notes: body.notes,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getPrinter(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.printer.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
