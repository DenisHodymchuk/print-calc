import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  // Admin: get conversations list or specific user's messages
  const forUserId = searchParams.get('userId')

  // Check if admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } }) as any
  const isAdmin = currentUser?.role === 'ADMIN'

  if (forUserId && isAdmin) {
    // Admin viewing specific user's chat
    const messages = await prisma.supportMessage.findMany({
      where: { userId: forUserId },
      orderBy: { createdAt: 'asc' },
    })
    // Mark user messages as read
    await prisma.supportMessage.updateMany({
      where: { userId: forUserId, fromAdmin: false, read: false },
      data: { read: true },
    })
    return NextResponse.json(messages)
  }

  if (isAdmin && !forUserId) {
    // Admin: get all conversations (grouped by user)
    const conversations = await prisma.$queryRaw`
      SELECT
        sm."userId",
        u.name,
        u.email,
        (SELECT message FROM "SupportMessage" WHERE "userId" = sm."userId" ORDER BY "createdAt" DESC LIMIT 1) as "lastMessage",
        (SELECT "createdAt" FROM "SupportMessage" WHERE "userId" = sm."userId" ORDER BY "createdAt" DESC LIMIT 1) as "lastAt",
        COUNT(CASE WHEN sm."fromAdmin" = false AND sm.read = false THEN 1 END)::int as "unread"
      FROM "SupportMessage" sm
      JOIN "User" u ON u.id = sm."userId"
      GROUP BY sm."userId", u.name, u.email
      ORDER BY "lastAt" DESC
    `
    return NextResponse.json(conversations)
  }

  // Regular user: get own messages
  const messages = await prisma.supportMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })
  // Mark admin messages as read
  await prisma.supportMessage.updateMany({
    where: { userId: session.user.id, fromAdmin: true, read: false },
    data: { read: true },
  })
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { message, userId } = body

  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } }) as any
  const isAdmin = currentUser?.role === 'ADMIN'

  // Admin replying to a user
  if (isAdmin && userId) {
    const msg = await prisma.supportMessage.create({
      data: { userId, message: message.trim(), fromAdmin: true },
    })
    return NextResponse.json(msg, { status: 201 })
  }

  // Regular user sending message
  const msg = await prisma.supportMessage.create({
    data: { userId: session.user.id, message: message.trim(), fromAdmin: false },
  })
  return NextResponse.json(msg, { status: 201 })
}
