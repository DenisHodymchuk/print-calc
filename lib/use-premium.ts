'use client'

import { useSession } from 'next-auth/react'

export function usePremium() {
  const { data: session } = useSession()
  const isPremium = session?.user?.isPremium ?? false
  const isAdmin = session?.user?.role === 'ADMIN'
  return { isPremium: isPremium || isAdmin, isAdmin }
}

// Free tier limits
export const FREE_LIMITS = {
  printers: 3,
  materials: 5,
  calculations: 10,
}
