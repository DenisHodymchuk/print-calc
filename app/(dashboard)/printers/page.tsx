import { Header } from '@/components/layout/header'
import { PrintersClient } from './printers-client'

export default function PrintersPage() {
  return (
    <>
      <Header title="Мої" accent="принтери" subtitle="Управління обладнанням та розрахунок окупності" />
      <PrintersClient />
    </>
  )
}
