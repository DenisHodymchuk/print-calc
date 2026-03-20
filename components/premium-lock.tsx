'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { usePremium } from '@/lib/use-premium'

interface PremiumLockProps {
  children: React.ReactNode
  feature?: string
}

export function PremiumLock({ children, feature }: PremiumLockProps) {
  const { isPremium } = usePremium()

  if (isPremium) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 select-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl shadow-lg px-5 py-4 text-center max-w-xs">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <p className="font-semibold text-sm">Преміум функція</p>
          {feature && <p className="text-xs text-muted-foreground mt-1">{feature}</p>}
          <Link href="/pricing" className="text-xs text-primary hover:underline mt-1 block">Дізнатись більше →</Link>
        </div>
      </div>
    </div>
  )
}

export function PremiumBadge() {
  const { isPremium } = usePremium()
  if (!isPremium) return null

  return (
    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
      PRO
    </span>
  )
}

export function PremiumGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isPremium } = usePremium()
  if (isPremium) return <>{children}</>
  return fallback ? <>{fallback}</> : null
}
