import { Header } from '@/components/layout/header'
import { MaterialsClient } from './materials-client'

export default function MaterialsPage() {
  return (
    <>
      <Header title="Мій" accent="філамент" subtitle="Каталог пластиків з фільтрами та цінами" />
      <MaterialsClient />
    </>
  )
}
