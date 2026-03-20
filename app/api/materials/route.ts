import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const brand = searchParams.get('brand')
  const color = searchParams.get('color')

  const materials = await prisma.material.findMany({
    where: {
      userId: session.user.id,
      ...(type ? { type: type as never } : {}),
      ...(brand ? { brand: { contains: brand, mode: 'insensitive' } } : {}),
      ...(color ? { color: { contains: color, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(materials)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, brand, color, colorHex, type, pricePerKg, density, failureRate, notes } = body

  if (!name || !pricePerKg) {
    return NextResponse.json({ error: "Назва та ціна обов'язкові" }, { status: 400 })
  }

  const material = await prisma.material.create({
    data: {
      userId: session.user.id,
      name,
      brand,
      color,
      colorHex,
      type: type || 'PLA',
      pricePerKg: parseFloat(pricePerKg),
      density: density ? parseFloat(density) : 1.24,
      failureRate: failureRate !== undefined && failureRate !== null ? parseFloat(failureRate) : 0.05,
      notes,
    },
  })

  return NextResponse.json(material, { status: 201 })
}
