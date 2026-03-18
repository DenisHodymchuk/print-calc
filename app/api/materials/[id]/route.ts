import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function getMaterial(id: string, userId: string) {
  return prisma.material.findFirst({ where: { id, userId } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getMaterial(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.material.update({
    where: { id },
    data: {
      name: body.name,
      brand: body.brand,
      color: body.color,
      colorHex: body.colorHex,
      type: body.type,
      pricePerKg: body.pricePerKg ? parseFloat(body.pricePerKg) : undefined,
      density: body.density ? parseFloat(body.density) : undefined,
      failureRate: body.failureRate ? parseFloat(body.failureRate) : undefined,
      notes: body.notes,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getMaterial(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.material.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
