import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, businessName } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email та пароль обов'язкові" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль має бути не менше 6 символів' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Користувач з таким email вже існує' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Check if promo trial is active
    const promo = await prisma.appSettings.findUnique({ where: { key: 'promoTrialDays' } })
    const premiumData = promo ? {
      isPremium: true,
      premiumUntil: new Date(Date.now() + parseInt(promo.value) * 86400000),
    } : {}

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        businessName,
        ...premiumData,
      },
    })

    return NextResponse.json(
      { message: 'Реєстрація успішна', userId: user.id },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
