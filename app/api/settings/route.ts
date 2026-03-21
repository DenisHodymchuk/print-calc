import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, businessName: true, hourlyRate: true, electricityRate: true, isPremium: true, premiumUntil: true },
  })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.businessName !== undefined) updateData.businessName = body.businessName
  if (body.hourlyRate !== undefined) updateData.hourlyRate = parseFloat(body.hourlyRate)
  if (body.electricityRate !== undefined) updateData.electricityRate = parseFloat(body.electricityRate)

  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: 'Введіть поточний пароль' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    const valid = await bcrypt.compare(body.currentPassword, user!.password)
    if (!valid) return NextResponse.json({ error: 'Невірний поточний пароль' }, { status: 400 })
    updateData.password = await bcrypt.hash(body.newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, email: true, name: true, businessName: true, hourlyRate: true, electricityRate: true },
  })

  return NextResponse.json(updated)
}
