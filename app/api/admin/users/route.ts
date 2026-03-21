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

  // Get promo setting
  const promo = await prisma.appSettings.findUnique({ where: { key: 'promoTrialDays' } })

  return NextResponse.json({ users, promo: promo ? { enabled: true, days: parseInt(promo.value) } : { enabled: false, days: 0 } })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Toggle promo: new registrations get PRO for N days
  if (body.action === 'togglePromo') {
    const enabled = body.enabled as boolean
    const days = body.days || 30
    if (enabled) {
      await prisma.appSettings.upsert({
        where: { key: 'promoTrialDays' },
        update: { value: String(days) },
        create: { key: 'promoTrialDays', value: String(days) },
      })
    } else {
      await prisma.appSettings.deleteMany({ where: { key: 'promoTrialDays' } })
    }
    return NextResponse.json({ enabled, days })
  }

  const { userId, isPremium, role } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof isPremium === 'boolean') {
    data.isPremium = isPremium
    data.premiumUntil = isPremium ? null : null // manual toggle — no expiry
  }
  if (role === 'ADMIN' || role === 'USER') data.role = role

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  })

  return NextResponse.json({ id: updated.id, role: updated.role, isPremium: updated.isPremium })
}
