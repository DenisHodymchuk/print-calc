import { Header } from '@/components/layout/header'
import { BoardClient } from './board-client'

export default function BoardPage() {
  return (
    <>
      <Header title="Дошка" accent="замовлень" subtitle="Керуйте статусами замовлень" />
      <BoardClient />
    </>
  )
}
