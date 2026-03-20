import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function isAdmin() {
  const session = await auth()
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return user?.role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')

  const users = await prisma.user.findMany({
    where: search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isPremium: true,
      premiumUntil: true,
      businessName: true,
      createdAt: true,
      _count: {
        select: { calculations: true, printers: true, materials: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { userId, isPremium, role } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof isPremium === 'boolean') data.isPremium = isPremium
  if (role === 'ADMIN' || role === 'USER') data.role = role

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  })

  return NextResponse.json({ id: updated.id, role: updated.role, isPremium: updated.isPremium })
}
