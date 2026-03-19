import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const templates = await prisma.calculation.findMany({
    where: {
      userId: session.user.id,
      isTemplate: true,
      ...(category ? { category } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      material: { select: { name: true, type: true, colorHex: true, color: true } },
      printer: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(templates)
}

// Get unique categories
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'categories') {
    const categories = await prisma.calculation.findMany({
      where: { userId: session.user.id, isTemplate: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    })
    return NextResponse.json(categories.map(c => c.category).filter(Boolean))
  }

  // Add to library
  if (body.action === 'add') {
    const calc = await prisma.calculation.findFirst({
      where: { id: body.calculationId, userId: session.user.id },
    })
    if (!calc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.calculation.update({
      where: { id: body.calculationId },
      data: { isTemplate: true, category: body.category || null },
    })
    return NextResponse.json({ success: true })
  }

  // Remove from library
  if (body.action === 'remove') {
    await prisma.calculation.update({
      where: { id: body.calculationId },
      data: { isTemplate: false, category: null },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
