import { Header } from '@/components/layout/header'
import { CalculationsClient } from './calculations-client'

export default function CalculationsPage() {
  return (
    <>
      <Header title="Розрахунки" />
      <CalculationsClient />
    </>
  )
}
