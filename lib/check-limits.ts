import { prisma } from '@/lib/prisma'
import { FREE_LIMITS } from '@/lib/use-premium'

export async function checkFreeLimit(userId: string, resource: 'printers' | 'materials' | 'calculations'): Promise<{ allowed: boolean; current: number; limit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, role: true, premiumUntil: true },
  })

  if (!user) return { allowed: false, current: 0, limit: 0 }

  const isPremium = user.role === 'ADMIN' || (user.isPremium && (!user.premiumUntil || user.premiumUntil > new Date()))
  if (isPremium) return { allowed: true, current: 0, limit: Infinity }

  const limit = FREE_LIMITS[resource]
  let current = 0

  if (resource === 'printers') {
    current = await prisma.printer.count({ where: { userId } })
  } else if (resource === 'materials') {
    current = await prisma.material.count({ where: { userId } })
  } else if (resource === 'calculations') {
    current = await prisma.calculation.count({ where: { userId } })
  }

  return { allowed: current < limit, current, limit }
}
