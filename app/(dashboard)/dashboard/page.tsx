import { Header } from '@/components/layout/header'

export default function DashboardPage() {
  return (
    <>
      <Header title="Дашборд" />
      <div className="p-6">
        <p className="text-muted-foreground">Тут буде аналітика та статистика.</p>
      </div>
    </>
  )
}
