'use client'

import { Header } from '@/components/layout/header'
import { DashboardClient } from './dashboard-client'
import { PremiumLock } from '@/components/premium-lock'

export default function DashboardPage() {
  return (
    <>
      <Header title="Мій" accent="дашборд" subtitle="Статистика та аналітика вашого бізнесу" />
      <PremiumLock feature="Аналітика та дашборд доступні у Преміум">
        <DashboardClient />
      </PremiumLock>
    </>
  )
}
