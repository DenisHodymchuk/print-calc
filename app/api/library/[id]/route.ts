import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const model = await prisma.model.findFirst({
    where: { id, userId: session.user.id },
    include: {
      calculations: {
        include: {
          material: { select: { name: true, type: true, colorHex: true, color: true } },
          printer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!model) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(model)
}
