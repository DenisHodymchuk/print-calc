import { Header } from '@/components/layout/header'
import { DashboardClient } from './dashboard-client'

export default function DashboardPage() {
  return (
    <>
      <Header title="Мій" accent="дашборд" subtitle="Статистика та аналітика вашого бізнесу" />
      <DashboardClient />
    </>
  )
}
