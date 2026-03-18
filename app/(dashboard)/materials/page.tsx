import { Header } from '@/components/layout/header'
import { MaterialsClient } from './materials-client'

export default function MaterialsPage() {
  return (
    <>
      <Header title="Матеріали" />
      <MaterialsClient />
    </>
  )
}
