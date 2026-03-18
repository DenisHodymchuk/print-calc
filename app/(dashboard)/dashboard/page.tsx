import { Header } from '@/components/layout/header'
import { DashboardClient } from './dashboard-client'

export default function DashboardPage() {
  return (
    <>
      <Header title="Дашборд" />
      <DashboardClient />
    </>
  )
}
