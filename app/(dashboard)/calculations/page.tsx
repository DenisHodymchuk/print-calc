import { Header } from '@/components/layout/header'
import { CalculationsClient } from './calculations-client'

export default function CalculationsPage() {
  return (
    <>
      <Header title="Мої" accent="розрахунки" subtitle="Бібліотека збережених розрахунків та кошторисів" />
      <CalculationsClient />
    </>
  )
}
