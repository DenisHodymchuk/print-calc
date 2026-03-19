import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET models with calculation counts
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const models = await prisma.model.findMany({
    where: {
      userId: session.user.id,
      ...(category ? { category } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      _count: { select: { calculations: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(models)
}

// POST — create model, get categories, add/remove calculation
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Get categories
  if (body.action === 'categories') {
    const categories = await prisma.model.findMany({
      where: { userId: session.user.id },
      select: { category: true },
      distinct: ['category'],
    })
    return NextResponse.json(categories.map(c => c.category))
  }

  // Create new model
  if (body.action === 'create') {
    if (!body.name?.trim() || !body.category?.trim()) {
      return NextResponse.json({ error: 'Name and category required' }, { status: 400 })
    }
    const model = await prisma.model.create({
      data: {
        userId: session.user.id,
        name: body.name.trim(),
        category: body.category.trim(),
        photoUrl: body.photoUrl || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(model, { status: 201 })
  }

  // Update model
  if (body.action === 'update') {
    const model = await prisma.model.findFirst({ where: { id: body.modelId, userId: session.user.id } })
    if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = await prisma.model.update({
      where: { id: body.modelId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      },
    })
    return NextResponse.json(updated)
  }

  // Delete model
  if (body.action === 'delete') {
    const model = await prisma.model.findFirst({ where: { id: body.modelId, userId: session.user.id } })
    if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Unlink calculations
    await prisma.calculation.updateMany({ where: { modelId: body.modelId }, data: { modelId: null } })
    await prisma.model.delete({ where: { id: body.modelId } })
    return NextResponse.json({ success: true })
  }

  // Link calculation to model
  if (body.action === 'link') {
    const calc = await prisma.calculation.findFirst({ where: { id: body.calculationId, userId: session.user.id } })
    if (!calc) return NextResponse.json({ error: 'Calculation not found' }, { status: 404 })
    await prisma.calculation.update({
      where: { id: body.calculationId },
      data: { modelId: body.modelId },
    })
    return NextResponse.json({ success: true })
  }

  // Unlink calculation from model
  if (body.action === 'unlink') {
    await prisma.calculation.update({
      where: { id: body.calculationId },
      data: { modelId: null },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
