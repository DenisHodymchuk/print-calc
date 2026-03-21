'use client'

import { useSession } from 'next-auth/react'

export function usePremium() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  let isPremium = session?.user?.isPremium ?? false
  // Check if premium expired
  const premiumUntil = session?.user?.premiumUntil
  if (isPremium && premiumUntil && new Date(premiumUntil) < new Date()) {
    isPremium = false
  }
  return { isPremium: isPremium || isAdmin, isAdmin, premiumUntil }
}

// Free tier limits
export const FREE_LIMITS = {
  printers: 3,
  materials: 5,
  calculations: 10,
}
